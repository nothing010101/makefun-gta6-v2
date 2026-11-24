# SOLMAR HEAT II

[![make.fun · gta6-01](https://make.fun/badge/gta6-01.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01) [![rank](https://make.fun/badge/gta6-01/nothing010101/makefun-gta6-v2/rank.svg)](https://make.fun/bounty/gta6-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-01) [![reward](https://make.fun/badge/gta6-01/nothing010101/makefun-gta6-v2/reward.svg)](https://make.fun/bounty/gta6-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-01)

Open-world crime game di kota pesisir fiktif **Solmar City** — matahari cerah, pantai, menara kaca, Club Neon, Casino Sol, dan dermaga. Dibangun dengan three.js (vendored lokal), tanpa jaringan sama sekali. Sekuel dari SOLMAR HEAT: kota lebih besar (11×11 blok), 10 misi cerita, polisi 5 bintang dengan roadblock dan helikopter, 4 senjata, garasi, balapan, radio, dan kru.

## Cerita

Jax Moreno, sopir getaway terbaik Solmar City, dikhianati sindikat Kane Rooker. Marisol Vega membangun kru baru — dan Jax adalah kuncinya. Sepuluh misi cerita membawamu dari antar paket, curi Comet GT, kabur dari SBPD, merampok Casino Sol, balapan pantai, menyabotase gudang Kane, sampai perampokan terakhir dan duel dengan Kane sendiri.

## Fitur

- Kota prosedural 11×11 blok (seeded RNG, deterministik): menara berjendela menyala, jalan berpalem, plaza + air mancur, pantai dan laut, dermaga, Casino Sol, Club Neon, Marisol's Garage, Solmar Arms, gudang Kane, garis start balapan
- Jalan kaki (WASD, Shift lari, kamera orbit mouse) + nyetir (handling arcade, Spasi rem tangan), E masuk-keluar mobil, curi mobil parkir, carjacking mobil lalu lintas
- Lalu lintas di jalan, pejalan kaki yang panik dan kabur saat ada kejahatan
- Wanted level 1–5: mobil SBPD mengejar + PIT, roadblock di 3+ bintang, helikopter CONDOR-1 dengan searchlight di 4–5 bintang, wanted menurun saat bersembunyi; Busted kalau tertangkap jalan kaki, Wasted kalau HP 0
- Combat: 4 senjata (Pistol P9, SMG Viper, Shotgun Boom, Rifle Falcon), tombol 1–4, amunisi + reload, muzzle flash, beli senjata/amunisi/armor di Solmar Arms; pukul saat tak bersenjata
- 10 misi cerita berurutan: dialog, marker + beacon, hadiah uang + respect, tipe goto / curi mobil / kabur / shootout / balapan / escort / heist / boss
- Garasi: beli 4 mobil (Vento S, Comet GT, Bison 4x4, Falco X — dibatasi respect rank), perbaiki mobil
- 3 balapan jalanan checkpoint (Balapan Pantai, Putaran Plaza, Grand Solmar), timer, hadiah, best time tersimpan
- Respect ranks: Rookie / Hustler / Wheelman / Kingpin — membuka misi lanjutan dan mobil garasi
- Radio: 3 stasiun prosedural WebAudio (SOLMAR FM, NEON 88, PLAYA WAVES), ganti dengan R
- Kru: Marisol (Q, getaway car) setelah misi 2; Rico (C, backup shooter) setelah misi 6
- HUD lengkap: uang, rank + respect, bintang wanted, HP + armor, kecepatan, senjata + amunisi, stasiun radio, objektif misi, timer balapan, minimap 2D live (jalan, misi, polisi, helikopter, roadblock, checkpoint), message feed, banner misi selesai
- Layar: judul, pause (Esc), toko (G), game over (Busted/Wasted), ending semua misi selesai
- Save/load ke localStorage (uang, HP, armor, misi, respect, mobil, best time balapan, senjata, kru)
- Suara prosedural WebAudio (mesin, tembakan, sirene, cash, jingle misi, radio), mute dengan M
- Mode screenshot deterministik: `?shot=start|chase|street|heist&seed=1`

## Cara main

```sh
node serve.ts
```

Lalu buka http://localhost:8080 di desktop Chrome.

Kontrol: WASD bergerak/menyetir, E masuk-keluar/curi mobil, klik kiri pukul, klik kanan tembak, 1–4 ganti senjata, Spasi rem tangan, Shift lari, F interaksi/mulai balapan, G toko, Q panggil Marisol, C panggil Rico, R ganti radio, Esc jeda, M mute, mouse putar kamera.

## Entri

Game untuk bounty make.fun **gta6-01** — https://make.fun/bounty/gta6-01. Semua kota, karakter, nama, cerita, dan suara orisinal; tidak ada aset dari game komersial mana pun.
