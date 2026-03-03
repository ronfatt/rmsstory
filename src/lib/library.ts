export type Chapter = {
  number: number;
  title: string;
  publishedAt: string;
  excerpt: string;
  content: string[];
};

export type Novel = {
  slug: string;
  title: string;
  tagline: string;
  genre: string;
  status: string;
  updateTime: string;
  coverTone: string;
  synopsis: string;
  hook: string;
  tags: string[];
  audience: string;
  metrics: {
    readers: string;
    updates: string;
    saved: string;
  };
  chapters: Chapter[];
};

export const novels: Novel[] = [
  {
    slug: "senja-di-kota-kertas",
    title: "Senja di Kota Kertas",
    tagline: "Romansa bandar dengan rahsia keluarga yang tidak pernah selesai.",
    genre: "Romansa Drama",
    status: "Dikemas kini setiap hari",
    updateTime: "Bab baru setiap jam 7:00 malam",
    coverTone: "from-amber-200 via-orange-400 to-rose-700",
    synopsis:
      "Alya kembali ke Kuala Lumpur untuk menyelamatkan kedai buku warisan ibunya. Di tengah hutang, persaingan hartanah, dan surat-surat lama yang hilang, dia bertemu semula dengan Rayhan, lelaki yang pernah meninggalkannya tanpa penjelasan.",
    hook: "Setiap bab menolak Alya lebih dekat kepada jawapan: adakah cinta pertamanya punca kehancuran keluarga atau satu-satunya jalan keluar?",
    tags: ["Cinta lama", "Keluarga", "Rahsia", "Bandar"],
    audience: "Untuk pembaca yang suka kisah emosi, dialog kuat, dan cliffhanger lembut.",
    metrics: {
      readers: "12.4k pembaca mingguan",
      updates: "18 bab tersedia",
      saved: "4.1k simpanan",
    },
    chapters: [
      {
        number: 1,
        title: "Surat yang Pulang Terlambat",
        publishedAt: "3 Mac 2026",
        excerpt: "Alya menemui sekotak surat lama ketika cuba mengosongkan rak belakang kedai buku ibunya.",
        content: [
          "Pagi itu, hujan turun renyai-renyai di Jalan TAR seperti seseorang sedang menahan tangis. Alya menolak pintu kayu kedai buku yang sudah sedikit senget dan segera disambut bau kertas lama, habuk, dan kenangan yang terlalu degil untuk mati.",
          "Dia datang bukan untuk bernostalgia. Dia datang kerana bank sudah menghantar notis kedua. Jika kedai itu tidak dihidupkan semula dalam masa sebulan, semuanya akan pergi bersama nama ibunya.",
          "Di rak belakang, tersepit di antara novel klasik dan majalah usang, dia menemui sebuah kotak hijau tua. Di dalamnya ada surat-surat yang tidak pernah sampai. Salah satu daripadanya ditujukan kepada seorang lelaki bernama Rayhan Arif.",
          "Nama itu membuat tangannya berhenti. Tiga tahun lalu, nama itu juga yang membuat hidupnya berhenti.",
          "Alya membuka surat pertama perlahan-lahan, dan sebaik sahaja membaca baris pembukaan, dia sedar ibunya telah menyimpan lebih daripada sekadar cerita. Ada rahsia yang telah menunggu cukup lama untuk kembali menuntut tempatnya."
        ]
      },
      {
        number: 2,
        title: "Lelaki di Hadapan Tingkap",
        publishedAt: "4 Mac 2026",
        excerpt: "Rayhan muncul tanpa amaran tepat ketika Alya bersedia membenci namanya sekali lagi.",
        content: [
          "Keesokan petang, kedai buku itu menerima pelanggan pertamanya selepas berminggu-minggu sepi. Alya yang sedang mengelap meja kaunter tidak mengangkat kepala sehingga dia terdengar suara rendah yang terlalu dikenalinya meminta sebuah buku puisi Melayu moden.",
          "Apabila dia mendongak, masa seakan-akan terlipat. Rayhan berdiri di hadapan tingkap dengan baju linen gelap dan wajah yang masih menyimpan tenang yang sama, cuma kali ini tenang itu kelihatan letih.",
          "\"Saya tak tahu kedai ini masih milik keluarga awak,\" katanya, seolah-olah ayat itu cukup untuk menutup jurang tiga tahun.",
          "Alya mahu menghalau dia keluar. Sebaliknya, dia bertanya soalan yang lebih berbahaya: mengapa namanya ada dalam surat ibunya?",
          "Rayhan tidak menjawab. Dia hanya memandang kotak hijau di atas meja dan wajahnya berubah, seperti seseorang baru sedar masa lalu sudah sampai ke pintu depan."
        ]
      },
      {
        number: 3,
        title: "Harga Sebuah Nama",
        publishedAt: "5 Mac 2026",
        excerpt: "Seorang pemaju memberi tempoh tujuh hari untuk Alya menjual kedai itu.",
        content: [
          "Surat tawaran itu datang dalam sampul krim tebal dengan logo syarikat pembangunan yang terlalu mewah untuk merasa jujur. Pemilik syarikat itu, Datuk Halim, menawarkan jumlah yang cukup besar untuk menutup hutang kedai dan membeli hidup baru untuk Alya.",
          "Tetapi ada satu syarat: dia mesti keluar sebelum minggu itu berakhir. Tiada rundingan, tiada lanjutan, dan tiada ruang untuk sentimentaliti.",
          "Rayhan, yang entah mengapa masih berada di situ, membaca surat itu dari jauh lalu berkata dengan nada yang mengganggu, \"Kalau dia mahukan tempat ini secepat itu, ertinya ada sesuatu yang dia tak mahu awak jumpa dahulu.\"",
          "Alya benci apabila lelaki itu masih tahu bagaimana mahu membuat dia ragu-ragu.",
          "Namun malam itu, ketika dia menyusun semula surat-surat ibunya, dia menemui satu resit lama atas nama Halim Holdings. Kedai buku itu pernah menjadi saksi urusan yang tidak pernah selesai."
        ]
      }
    ]
  },
  {
    slug: "waris-bulan-terakhir",
    title: "Waris Bulan Terakhir",
    tagline: "Fantasi istana tentang takdir, darah diraja, dan perjanjian yang dilanggar.",
    genre: "Fantasi",
    status: "Bab baharu harian",
    updateTime: "Bab baru setiap jam 9:00 malam",
    coverTone: "from-emerald-200 via-teal-500 to-slate-800",
    synopsis:
      "Di kerajaan pesisir yang dikawal oleh cahaya bulan, Dara hidup sebagai penenun biasa sehingga malam gerhana mendedahkan simbol warisan di pergelangan tangannya. Kini dia diburu oleh istana yang mahu menghapuskan pewaris terakhir takhta.",
    hook: "Setiap keputusan Dara boleh menyelamatkan kerajaannya atau memulakan perang yang telah diramal beratus tahun.",
    tags: ["Istana", "Takdir", "Magis", "Pengkhianatan"],
    audience: "Untuk pembaca yang sukakan dunia fantasi ringan dengan emosi yang mudah diikuti.",
    metrics: {
      readers: "9.8k pembaca mingguan",
      updates: "22 bab tersedia",
      saved: "3.6k simpanan",
    },
    chapters: [
      {
        number: 1,
        title: "Gerhana Pertama",
        publishedAt: "3 Mac 2026",
        excerpt: "Langit yang gelap terlalu awal mengubah nasib Dara dalam satu malam.",
        content: [
          "Dara selalu percaya hidupnya akan berakhir di rumah anyaman kecil di hujung Teluk Sarma. Dia mengenali bunyi laut, rentak alat tenun, dan kesunyian yang datang selepas matahari terbenam. Itu sahaja dunianya, dan selama ini itu sudah cukup.",
          "Namun pada malam gerhana, ketika seluruh kampung berkumpul dengan lampu minyak dan doa-doa lama, kulit di pergelangan tangannya menyala seperti disapu perak cair. Corak sabit yang selama ini samar menjadi terang di bawah cahaya bulan yang hilang.",
          "Orang tua kampung jatuh melutut. Seorang pengawal istana yang menyamar di kalangan mereka terus membuka pedang.",
          "\"Cari pewaris itu,\" bisiknya kepada langit yang gelap, seolah-olah arahan itu sudah lama menunggu untuk dilepaskan.",
          "Dara tidak memahami apa-apa, tetapi dia tahu satu perkara: sebaik sahaja simbol itu muncul, rumah kecilnya bukan lagi tempat yang selamat."
        ]
      },
      {
        number: 2,
        title: "Peta di Bawah Tikar",
        publishedAt: "4 Mac 2026",
        excerpt: "Nenek Dara meninggalkan lebih banyak rahsia daripada harta.",
        content: [
          "Sebelum subuh, Dara menggeledah seluruh rumah sambil menahan tangis yang tidak sempat keluar. Neneknya sudah tiada dua musim lalu, tetapi setiap sudut rumah seolah-olah masih menyimpan pesanan yang belum sempat diberitahu.",
          "Di bawah tikar rotan yang paling lama, dia menemui sekeping peta yang dilukis dengan dakwat biru gelap. Laluan-laluan di atasnya bukan menuju pasar atau pelabuhan. Ia menuju ke menara lama di tengah hutan air pasang, tempat yang orang kampung selalu sebut hanya dengan suara perlahan.",
          "Di penjuru peta, ada simbol sabit yang sama dengan pergelangan tangannya.",
          "Dara menggulung peta itu ketika bunyi tapak kuda terdengar dari luar rumah. Pengawal sudah tiba lebih cepat daripada yang dia jangka.",
          "Tanpa sempat membawa apa-apa selain pisau kecil dan kain shawl neneknya, Dara lari ke belakang rumah dan membiarkan kampungnya tenggelam dalam kekacauan yang tidak dia faham."
        ]
      }
    ]
  },
  {
    slug: "janji-pada-hujung-hujan",
    title: "Janji pada Hujung Hujan",
    tagline: "Drama keluarga dan misteri kehilangan yang bermula dengan satu rakaman suara.",
    genre: "Misteri Keluarga",
    status: "Diterbitkan setiap hari",
    updateTime: "Bab baru setiap jam 6:30 pagi",
    coverTone: "from-sky-200 via-cyan-400 to-blue-900",
    synopsis:
      "Nurin pulang ke kampung selepas menerima rakaman suara arwah kakaknya yang sepatutnya mustahil wujud. Setiap jejak yang ditinggalkan membawa dia kepada rahsia keluarga yang telah disembunyikan sejak banjir besar lima belas tahun lalu.",
    hook: "Apabila masa lalu mula bersuara, Nurin perlu memilih antara melindungi keluarganya atau membongkar kebenaran hingga ke akar.",
    tags: ["Kampung", "Misteri", "Kakak", "Rahsia lama"],
    audience: "Untuk pembaca yang mahukan suasana muram, emosi keluarga, dan misteri yang bergerak perlahan.",
    metrics: {
      readers: "7.1k pembaca mingguan",
      updates: "14 bab tersedia",
      saved: "2.2k simpanan",
    },
    chapters: [
      {
        number: 1,
        title: "Suara Selepas Tengah Malam",
        publishedAt: "3 Mac 2026",
        excerpt: "Nurin menerima mesej suara yang menggunakan suara kakaknya yang sudah meninggal dunia.",
        content: [
          "Telefon Nurin berbunyi pada jam 12:17 malam, waktu yang terlalu lewat untuk sesiapa datang membawa berita baik. Dia hampir membiarkan panggilan itu mati sendiri, tetapi sebuah mesej suara masuk beberapa saat kemudian.",
          "Rakaman itu hanya berdurasi dua puluh enam saat. Di dalamnya ada bunyi hujan, nafas yang tergesa, dan suara perempuan yang memanggil namanya dengan lembut. Suara itu milik Zara, kakaknya, yang dikebumikan dua belas tahun lalu.",
          "\"Kalau kau dengar ini, jangan percaya cerita ayah,\" kata suara itu sebelum rakaman terputus dengan bunyi air deras.",
          "Nurin duduk kaku di hujung katil apartmennya di Shah Alam, seolah-olah seluruh bilik telah kehilangan udara. Selama ini, dia belajar hidup dengan luka yang tidak tertutup. Malam itu, luka itu dibuka semula oleh seseorang yang sepatutnya sudah tiada.",
          "Pagi esoknya, tanpa memaklumkan sesiapa, Nurin membeli tiket bas pulang ke kampung."
        ]
      },
      {
        number: 2,
        title: "Rumah yang Tidak Lagi Sama",
        publishedAt: "4 Mac 2026",
        excerpt: "Kepulangan Nurin disambut dengan dinding baru dan wajah lama yang semakin sukar dibaca.",
        content: [
          "Rumah papan itu kini disimen separuh, seolah-olah keluarganya cuba menampal masa lalu dengan bahan yang lebih keras. Namun bau tanah lembap selepas hujan masih sama, dan itulah yang paling cepat menarik kembali ingatan Nurin.",
          "Ayahnya membuka pintu dengan wajah yang kaku. Tiada pelukan, tiada pertanyaan panjang, hanya satu pandangan yang seolah-olah mengira berapa banyak rahsia yang mungkin telah dibawa pulang bersama anak bongsunya.",
          "Di ruang tamu, gambar Zara masih tergantung, tetapi bingkainya baru. Seseorang menjaga kenangannya rapi sambil menyembunyikan sesuatu di belakangnya.",
          "Malam itu, ketika Nurin berdiri di bawah bumbung zink mendengar hujan turun, dia mendengar bisikan dari jiran sebelah tentang sebuah stor lama yang dikunci sejak banjir besar.",
          "Dan tiba-tiba, mesej suara itu tidak lagi terasa mustahil. Ia terasa seperti amaran yang datang terlalu lambat."
        ]
      }
    ]
  }
];

export function getNovel(slug: string) {
  return novels.find((novel) => novel.slug === slug);
}

export function getChapter(novelSlug: string, chapterNumber: number) {
  const novel = getNovel(novelSlug);

  if (!novel) {
    return undefined;
  }

  return novel.chapters.find((chapter) => chapter.number === chapterNumber);
}
