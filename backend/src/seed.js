// Synthetic seed: 12 alumni + 20 students, no real PII. Run: npm run seed (needs Oracle up)
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { q, one } = require('./config/db');
const DOMAINS = ['DevOps', 'AI/ML', 'Web Dev', 'Data Science', 'Cybersecurity', 'Mobile'];
const GOALS = ['placement', 'higher_studies', 'startup', 'skill'];
const LANGS = [['English'], ['English', 'Hindi'], ['English', 'Marathi'], ['Hindi']];
const mk = (arr) => arr[Math.floor(Math.random() * arr.length)];
async function user(email, role, name, langs, hash) {
  const ex = await one('SELECT id FROM users WHERE email = :email', { email });
  if (ex) return ex.id;
  const id = uuid();
  await q(`INSERT INTO users (id, email, password_hash, role, full_name, languages, consent_given)
           VALUES (:id, :email, :hash, :role, :name, :langs, 1)`,
    { id, email, hash, role, name, langs: JSON.stringify(langs) });
  return id;
}
async function run() {
  const hash = await bcrypt.hash('Password123!', 12);
  await user('coordinator@college.edu', 'coordinator', 'Capstone Coordinator', ['English'], hash);
  for (let i = 1; i <= 12; i++) {
    const id = await user(`alumni${i}@example.com`, 'alumni', `Alumni ${i}`, mk(LANGS), hash);
    const tags = [mk(DOMAINS), mk(DOMAINS)].filter((x, ix, a) => a.indexOf(x) === ix);
    const ex = await one('SELECT user_id FROM alumni_profiles WHERE user_id = :id', { id });
    if (!ex) await q(`INSERT INTO alumni_profiles (user_id, graduation_year, company, designation, expertise_tags, years_exp, max_mentees)
                      VALUES (:id, :gy, :co, :des, :tags, :exp, :cap)`,
      { id, gy: 2018 + (i % 6), co: mk(['Google', 'TCS', 'Startup XYZ', 'Infosys']), des: mk(['SDE-2', 'DevOps Eng', 'Data Scientist']), tags: JSON.stringify(tags), exp: 1 + (i % 8), cap: 3 + (i % 4) });
    for (const d of [1, 3, 5]) {
      const s = await one('SELECT id FROM availability_slots WHERE alumni_user_id = :id AND day_of_week = :d', { id, d });
      if (!s) await q('INSERT INTO availability_slots (id, alumni_user_id, day_of_week, start_time, end_time) VALUES (:id, :aid, :d, :st, :et)',
        { id: uuid(), aid: id, d, st: '18:00', et: '20:00' });
    }
  }
  for (let i = 1; i <= 20; i++) {
    const id = await user(`student${i}@college.edu`, 'student', `Student ${i}`, mk(LANGS), hash);
    const ex = await one('SELECT user_id FROM student_profiles WHERE user_id = :id', { id });
    if (!ex) await q(`INSERT INTO student_profiles (user_id, enrollment_no, department, study_year, goals, domain_interests)
                      VALUES (:id, :enr, 'IT', 3, :goals, :domains)`,
      { id, enr: `ENR2024${String(i).padStart(3, '0')}`, goals: JSON.stringify({ primary: mk(GOALS) }), domains: JSON.stringify([mk(DOMAINS)]) });
  }
  console.log('seeded: coordinator@college.edu / alumni1@example.com / student1@college.edu | pw Password123!');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
