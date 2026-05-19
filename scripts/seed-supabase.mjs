import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Thiếu thông tin Supabase trong file .env (VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY).");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  console.log("Đang đọc dữ liệu từ library.json...");
  const dataPath = path.join(__dirname, '../public/data/library.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error("Không tìm thấy file library.json tại", dataPath);
    process.exit(1);
  }
  
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  console.log("Đang đẩy Categories lên Supabase...");
  for (const cat of data.categories) {
    const { error } = await supabase.from('categories').upsert({
      id: cat.id,
      title: cat.title,
      description: cat.desc,
      icon_name: cat.iconName,
      color: cat.color
    });
    if (error) {
      console.error("Lỗi khi thêm Category", cat.id, error);
    } else {
      console.log(`Đã thêm Category: ${cat.title}`);
    }
  }
  
  console.log("\nĐang đẩy Books lên Supabase...");
  // Clear books table first to avoid duplicates if run multiple times (optional, but good for testing)
  // await supabase.from('books').delete().neq('id', 0);
  
  for (const [catId, books] of Object.entries(data.books)) {
    for (const book of books) {
      const { error } = await supabase.from('books').insert({
        category_id: catId,
        title: book.title,
        author: book.author,
        type: book.type,
        read_time: book.time,
        summary: book.summary,
        sections: book.sections
      });
      if (error) {
        console.error("Lỗi khi thêm Sách", book.title, error);
      } else {
        console.log(`Đã thêm Sách: ${book.title}`);
      }
    }
  }
  
  console.log("\nHoàn tất đẩy dữ liệu Thư viện lên Supabase!");
}

seed();
