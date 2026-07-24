import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

export async function GET() {
  try {
    const teamsRes = await sql`SELECT * FROM teams ORDER BY id ASC`;
    const judgesRes = await sql`SELECT * FROM judges ORDER BY id ASC`;
    const scoresRes = await sql`SELECT * FROM scores`;
    const socialRes = await sql`SELECT * FROM social_votes`;
    const auditRes = await sql`SELECT * FROM score_audit ORDER BY created_at DESC`;

    const teams = teamsRes.rows;
    const judges = judgesRes.rows;
    const scores = scoresRes.rows;
    const socials = socialRes.rows;
    const audits = auditRes.rows;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'เสียงอยู่ไส Contest System';
    workbook.created = new Date();

    // 1. สรุปผลการแข่งขัน
    const sheet1 = workbook.addWorksheet('1. สรุปผลการแข่งขัน', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet1.columns = [
      { header: 'อันดับ', key: 'rank', width: 10 },
      { header: 'รหัสทีม', key: 'team_id', width: 15 },
      { header: 'ชื่อทีม', key: 'team_name', width: 35 },
      { header: 'ส่วนที่ 1 (กรรมการ 80%)', key: 'score1', width: 25 },
      { header: 'ส่วนที่ 2 (พวงมาลัย 20%)', key: 'score2', width: 25 },
      { header: 'รวม (100 คะแนน)', key: 'total', width: 20 },
    ];

    // คำนวณส่วนที่ 1 (กรรมการ 80%)
    const teamScore1: Record<string, number> = {};
    for (const t of teams) {
      const teamScores = scores.filter(s => s.team_id === t.id);
      if (teamScores.length > 0) {
        const sumOfSums = teamScores.reduce((acc, s) => acc + s.c1 + s.c2 + s.c3 + s.c4 + s.c5 + s.c6 + s.c7, 0);
        // เต็ม 100 ดิบต่อกรรมการ. มีกรรมการกี่ท่าน (เช่น 5) ให้หาค่าเฉลี่ย
        // จากนั้นแปลง 100 ดิบ เป็น 80% (คือคูณ 0.8)
        // หรือสมมติว่าเกณฑ์ 7 ข้อรวมกันเต็ม 100 พอดี -> (ค่าเฉลี่ยดิบ * 0.8) = ส่วนที่ 1
        const avgScore = sumOfSums / teamScores.length;
        teamScore1[t.id] = avgScore * 0.8;
      } else {
        teamScore1[t.id] = 0;
      }
    }

    // คำนวณส่วนที่ 2 (พวงมาลัย 20%)
    // พวงมาลัยจัดอันดับ 1-11
    const socialRanked = [...socials].sort((a, b) => b.garlands - a.garlands);
    const teamScore2: Record<string, number> = {};
    const teamSocialRank: Record<string, number> = {};
    let currentRank = 1;
    let currentScore = 20;

    for (let i = 0; i < socialRanked.length; i++) {
      if (i > 0 && socialRanked[i].garlands < socialRanked[i-1].garlands) {
        currentRank = i + 1; // 1224 ranking
        currentScore = 20 - (currentRank - 1);
        if (currentScore < 10) currentScore = 10; // min 10 points for rank 11
      }
      teamSocialRank[socialRanked[i].team_id] = currentRank;
      teamScore2[socialRanked[i].team_id] = currentScore;
    }

    // สำหรับทีมที่ไม่มีข้อมูลพวงมาลัย ให้คะแนน 0
    for (const t of teams) {
      if (teamScore2[t.id] === undefined) teamScore2[t.id] = 0;
    }

    // คำนวณ Total
    const finalResults = teams.map(t => {
      const s1 = teamScore1[t.id] || 0;
      const s2 = teamScore2[t.id] || 0;
      return {
        id: t.id,
        name: t.name,
        score1: s1,
        score2: s2,
        total: s1 + s2
      };
    });

    finalResults.sort((a, b) => b.total - a.total);

    finalResults.forEach((r, index) => {
      sheet1.addRow({
        rank: index + 1,
        team_id: r.id,
        team_name: r.name,
        score1: r.score1,
        score2: r.score2,
        total: r.total
      });
    });

    // ตกแต่ง Sheet1
    sheet1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E0B2E' } };
    sheet1.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber <= 5) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } }; // Highlight top 4
      }
    });

    // 2. คะแนนรายกรรมการ
    const sheet2 = workbook.addWorksheet('2. คะแนนรายกรรมการ', { views: [{ state: 'frozen', ySplit: 1, xSplit: 2 }] });
    const s2cols: any[] = [
      { header: 'รหัสทีม', key: 'team_id', width: 15 },
      { header: 'ชื่อทีม', key: 'team_name', width: 35 },
    ];
    judges.forEach(j => s2cols.push({ header: j.name, key: `j_${j.id}`, width: 15 }));
    s2cols.push({ header: 'รวมดิบ', key: 'sum', width: 15 });
    s2cols.push({ header: 'เฉลี่ย (เต็ม 100)', key: 'avg', width: 15 });
    sheet2.columns = s2cols;

    teams.forEach(t => {
      const rowData: any = { team_id: t.id, team_name: t.name };
      const teamScores = scores.filter(s => s.team_id === t.id);
      let sum = 0;
      judges.forEach(j => {
        const s = teamScores.find(ts => ts.judge_id === j.id);
        if (s) {
          const sTotal = s.c1 + s.c2 + s.c3 + s.c4 + s.c5 + s.c6 + s.c7;
          rowData[`j_${j.id}`] = sTotal;
          sum += sTotal;
        }
      });
      rowData['sum'] = sum;
      rowData['avg'] = teamScores.length > 0 ? sum / teamScores.length : 0;
      sheet2.addRow(rowData);
    });
    sheet2.getRow(1).font = { bold: true };
    sheet2.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5197A' } };

    // 3. คะแนนรายเกณฑ์
    const sheet3 = workbook.addWorksheet('3. คะแนนรายเกณฑ์', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet3.columns = [
      { header: 'กรรมการ', key: 'judge', width: 20 },
      { header: 'ทีม', key: 'team', width: 35 },
      { header: 'C1(20)', key: 'c1', width: 10 },
      { header: 'C2(20)', key: 'c2', width: 10 },
      { header: 'C3(15)', key: 'c3', width: 10 },
      { header: 'C4(15)', key: 'c4', width: 10 },
      { header: 'C5(15)', key: 'c5', width: 10 },
      { header: 'C6(10)', key: 'c6', width: 10 },
      { header: 'C7(5)', key: 'c7', width: 10 },
      { header: 'หมายเหตุ', key: 'note', width: 30 },
      { header: 'แอดมินแก้', key: 'edited', width: 15 }
    ];

    scores.forEach(s => {
      const j = judges.find(j => j.id === s.judge_id);
      const t = teams.find(t => t.id === s.team_id);
      const row = sheet3.addRow({
        judge: j ? j.name : s.judge_id,
        team: t ? t.name : s.team_id,
        c1: s.c1, c2: s.c2, c3: s.c3, c4: s.c4, c5: s.c5, c6: s.c6, c7: s.c7,
        note: s.note,
        edited: s.edited_by_admin ? 'Yes (✏️)' : ''
      });
      if (s.edited_by_admin) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } }; // Light orange flag
      }
    });
    sheet3.getRow(1).font = { bold: true };
    sheet3.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF16BDCA' } };

    // 4. คะแนนโซเชียล
    const sheet4 = workbook.addWorksheet('4. คะแนนโซเชียล', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet4.columns = [
      { header: 'ชื่อทีม', key: 'team', width: 35 },
      { header: 'พวงมาลัย', key: 'garlands', width: 15 },
      { header: 'อันดับพวงมาลัย', key: 'g_rank', width: 15 },
      { header: 'ส่วนที่ 2 (เต็ม 20)', key: 'score2', width: 20 },
      { header: 'ถูกใจ (x1)', key: 'likes', width: 15 },
      { header: 'คอมเมนต์ (x2)', key: 'comments', width: 15 },
      { header: 'แชร์ (x3)', key: 'shares', width: 15 },
      { header: 'Social Score (Popular Vote)', key: 'social_score', width: 30 }
    ];

    const socialRows = teams.map(t => {
      const soc = socials.find(s => s.team_id === t.id) || { garlands: 0, likes: 0, comments: 0, shares: 0 };
      const social_score = (soc.likes * 1) + (soc.comments * 2) + (soc.shares * 3);
      return {
        team: t.name,
        garlands: soc.garlands,
        g_rank: teamSocialRank[t.id] || '-',
        score2: teamScore2[t.id],
        likes: soc.likes,
        comments: soc.comments,
        shares: soc.shares,
        social_score: social_score
      };
    });

    socialRows.sort((a, b) => b.social_score - a.social_score); // Sort by popular vote

    socialRows.forEach(r => sheet4.addRow(r));
    sheet4.getRow(1).font = { bold: true };
    sheet4.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5B301' } };

    // 5. บันทึกการแก้ไข (Audit Log)
    const sheet5 = workbook.addWorksheet('5. บันทึกการแก้ไข', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet5.columns = [
      { header: 'เวลา (Time)', key: 'time', width: 20 },
      { header: 'ผู้กระทำ (Actor)', key: 'actor', width: 15 },
      { header: 'การกระทำ (Action)', key: 'action', width: 15 },
      { header: 'กรรมการ (Judge)', key: 'judge', width: 20 },
      { header: 'ทีม (Team)', key: 'team', width: 35 },
      { header: 'ข้อมูลเดิม (Before)', key: 'before', width: 40 },
      { header: 'ข้อมูลใหม่ (After)', key: 'after', width: 40 },
      { header: 'เหตุผล (Reason)', key: 'reason', width: 30 }
    ];

    audits.forEach(a => {
      const j = judges.find(j => j.id === a.judge_id);
      const t = teams.find(t => t.id === a.team_id);
      sheet5.addRow({
        time: new Date(a.created_at).toLocaleString('th-TH'),
        actor: a.actor,
        action: a.action,
        judge: j ? j.name : a.judge_id,
        team: t ? t.name : a.team_id,
        before: a.before_data ? JSON.stringify(a.before_data) : '-',
        after: a.after_data ? JSON.stringify(a.after_data) : '-',
        reason: a.reason || '-'
      });
    });
    sheet5.getRow(1).font = { bold: true };
    sheet5.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1D5DB' } };

    // Format Data
    const buffer = await workbook.xlsx.writeBuffer();

    // Return response
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `ผลการแข่งขัน_เสียงอยู่ไส_${dateStr}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
