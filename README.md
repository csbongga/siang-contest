# เสียงอยู่ไส Contest - ระบบให้คะแนนการประกวด

ระบบเว็บแอปพลิเคชันสำหรับให้กรรมการกดให้คะแนนประกวด "เสียงอยู่ไส Contest" สร้างด้วย Next.js (App Router), Tailwind CSS และใช้งานร่วมกับ Vercel Postgres

## การ Deploy ด้วย GitHub และ Vercel (ฟรี)

1. **อัปโหลดโค้ดขึ้น GitHub**
   - สร้าง Repository ใหม่ในบัญชี GitHub ของคุณ
   - รันคำสั่งต่อไปนี้ในโฟลเดอร์นี้:
     ```bash
     git init
     git add .
     git commit -m "Initial commit"
     git branch -M main
     git remote add origin https://github.com/USERNAME/REPONAME.git
     git push -u origin main
     ```

2. **นำเข้า (Import) สู่ Vercel**
   - ล็อกอินเข้า [Vercel](https://vercel.com/)
   - กดปุ่ม "Add New..." -> "Project"
   - นำเข้า Repository จาก GitHub ที่เพิ่งสร้าง

3. **ตั้งค่า Database (Vercel Postgres)**
   - เมื่อสร้าง Project ใน Vercel เสร็จแล้ว ให้เข้าไปที่เมนู **Storage**
   - เลือกสร้างฐานข้อมูล **Postgres** (สร้างฐานข้อมูลใหม่หรือใช้ที่มีอยู่)
   - เมื่อสร้างเสร็จ Vercel จะเพิ่ม Environment Variables ให้อัตโนมัติ (เช่น `POSTGRES_URL`)

4. **ตั้งค่า Environment Variable สำหรับ Admin**
   - ไปที่เมนู **Settings -> Environment Variables** ใน Vercel
   - เพิ่ม Key ชื่อ `ADMIN_PASSWORD` และใส่รหัสผ่านที่ต้องการ (เช่น `secret1234`)
   - กดปุ่ม **Save** และทำการ **Redeploy** โปรเจกต์อีกครั้งเพื่อให้ค่า ENV ทำงาน

5. **สร้างตารางและข้อมูลเริ่มต้น (Seed Data)**
   - หลังจาก Deploy แล้ว สามารถรันคำสั่งบนเครื่องของคุณได้:
     1. คัดลอก `POSTGRES_URL` จาก Vercel มาใส่ในไฟล์ `.env.local` ในเครื่องคุณ
     2. เปิด Terminal ในโฟลเดอร์นี้แล้วรัน `npm run db:setup` เพื่อสร้างตารางข้อมูล
   - **ทางเลือกอื่น:** นำคำสั่ง SQL จากในไฟล์ `db/schema.sql` ไปวางในแท็บ Data ของ Vercel Postgres เพื่อรันสร้างตารางแบบ Manual ก็ได้

## การใช้งาน

- **หน้าสำหรับกรรมการให้คะแนน (`/`)**
  - กรรมการเลือกชื่อตนเองและใส่รหัส PIN (ตัวอย่างในระบบ: 1234, 5678, 9999)
  - เลือกทีมและให้คะแนนตามเกณฑ์
- **หน้าผลคะแนน (`/results`)**
  - สรุปผลรวมคะแนนและจัดอันดับ มีปุ่มโหลดไฟล์ CSV สำหรับเปิดบน Excel ได้ทันที
- **หน้าผู้ดูแลระบบ (`/admin`)**
  - ใส่รหัสผ่านที่ตั้งใน `ADMIN_PASSWORD` 
  - ใช้สำหรับเพิ่มทีม, เพิ่มรายชื่อกรรมการ, หรือตั้งค่า PIN
  - สามารถลบข้อมูลผลคะแนนทั้งหมดได้ (Danger Zone)
