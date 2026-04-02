import { PrismaClient, Kondisi } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as bcrypt from 'bcryptjs'
import path from 'path'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Mulai seeding...')

  // ── Buat default Admin ──
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@semenbaturaja.co.id' },
    update: {},
    create: {
      name:     'Administrator',
      email:    'admin@semenbaturaja.co.id',
      password: hashedPassword,
      role:     'admin'
    }
  })
  console.log('✅ Admin user dibuat')

  // ── Buat default User Biasa ──
  const kataSandiBaruUser = 'user123'; // <--- Tulis katasandi baru disini
  const hashedUserPassword = await bcrypt.hash(kataSandiBaruUser, 10)
  
  await prisma.user.upsert({
    where: { email: 'user@semenbaturaja.co.id' },
    update: {
      password: hashedUserPassword // <--- Tambahkan agar database menimpa pwd lama
    }, 
    create: {
      name:     'User Biasa',
      email:    'user@semenbaturaja.co.id',
      password: hashedUserPassword,
      role:     'user'
    }
  })
  console.log(`✅ User biasa dibuat/diupdate (Pwd: ${kataSandiBaruUser})`)

  // ── Import Excel ──
  const filePath = path.join(__dirname, '../data/Master_Data_Aset_Umum.XLSX')
  const workbook = XLSX.readFile(filePath)
  const sheet    = workbook.Sheets['Aset Tetap per 30 Jun 2025']
  const rows     = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    range:  5   // mulai dari baris ke-6 (skip header)
  }) as any[][]

  console.log(`📂 Total baris Excel: ${rows.length}`)

  let success = 0
  let skipped = 0

  for (const row of rows) {
    const nomorAset = row[3]?.toString().trim()
    const namaAset  = row[4]?.toString().trim()

    // Skip baris kosong
    if (!nomorAset || !namaAset) {
      skipped++
      continue
    }

    await prisma.asset.upsert({
      where:  { nomorAset },
      update: {},   // jika sudah ada, tidak diupdate
      create: {
        kodeKelas:     row[0]?.toString().trim() || null,
        kelasAsetSmbr: row[1]?.toString().trim() || null,
        kelasAsetSig:  row[2]?.toString().trim() || null,
        nomorAset,
        namaAset,
        site:          row[5]?.toString().trim() || null,
        qty:           Number(row[6]) || 1,
        satuan:        row[7]?.toString().trim() || 'PC',
        kondisi:       Kondisi.BELUM_DICEK
      }
    })
    success++

    if (success % 500 === 0) {
      console.log(`   ↳ ${success} aset diproses...`)
    }
  }

  console.log(`\n✅ Berhasil import : ${success} aset`)
  console.log(`⏭️  Dilewati        : ${skipped} baris`)
  console.log('\n🎉 Seeding selesai!')
}

main()
  .catch(e => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })