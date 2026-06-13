// ===================================================
// 🔐 KONFIGURASI PIN KEAMANAN JURNAL PKL
// ===================================================
const SEED_PIN = "2207"; // PIN rahasia kamu sekarang

// Logika memeriksa PIN saat tombol masuk di-klik
document.getElementById("pinBtn").addEventListener("click", checkPIN);
document.getElementById("pinInput").addEventListener("keypress", (e) => { 
    if (e.key === 'Enter') checkPIN(); 
});

function checkPIN() {
    const input = document.getElementById("pinInput").value;
    if (input === SEED_PIN) {
        document.getElementById("pinOverlay").style.opacity = "0";
        setTimeout(() => {
            document.getElementById("pinOverlay").style.display = "none";
        }, 300);
    } else {
        const msg = document.getElementById("pinMsg");
        msg.style.display = "block";
        document.getElementById("pinInput").value = "";
    }
}
// ===================================================

const hariIndonesia = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// Mengambil data dari localStorage
let jurnalData = JSON.parse(localStorage.getItem("jurnalPKL")) || [];
let chart = null;
let editIndex = null; // Menyimpan status indeks data yang sedang diedit

// DOM Elements
const tglInput = document.getElementById("tanggal");
const hariInput = document.getElementById("hari");
const jurnalForm = document.getElementById("jurnalForm");
const journalList = document.getElementById("journalList");
const searchInput = document.getElementById("searchInput");
const filterBulan = document.getElementById("filterBulan");
const darkBtn = document.getElementById("darkBtn");

// Set Tanggal Hari Ini & Autofill Hari secara Otomatis saat Load Halaman
window.addEventListener("DOMContentLoaded", () => {
    const hariIni = new Date();
    const yyyy = hariIni.getFullYear();
    const mm = String(hariIni.getMonth() + 1).padStart(2, '0');
    const dd = String(hariIni.getDate()).padStart(2, '0');
    
    tglInput.value = `${yyyy}-${mm}-${dd}`;
    hariInput.value = hariIndonesia[hariIni.getDay()];
    
    // Autofill nama pembimbing terakhir kali agar efisien
    if (jurnalData.length > 0) {
        document.getElementById("pembimbing").value = jurnalData[jurnalData.length - 1].pembimbing || "";
    }

    render();
});

// Update Hari ketika Tanggal Diubah User
tglInput.addEventListener("change", () => {
    if (tglInput.value) {
        const d = new Date(tglInput.value);
        hariInput.value = hariIndonesia[d.getDay()];
    }
});

// Hitung Durasi Jam Kerja Nyata
function hitungJam(masuk, pulang) {
    if (!masuk || !pulang) return 0;
    const start = new Date(`2000-01-01 ${masuk}`);
    const end = new Date(`2000-01-01 ${pulang}`);
    let selisih = (end - start) / 1000 / 60 / 60;
    return selisih < 0 ? selisih + 24 : selisih; // Handle shift melewati tengah malam jika ada
}

// Handler Simpan & Ubah (Edit) Data Form
jurnalForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const fotoInput = document.getElementById("foto");
    const file = fotoInput.files[0];

    const simpanProses = (fotoBase64) => {
        const obj = {
            tanggal: tglInput.value,
            hari: hariInput.value,
            jamMasuk: document.getElementById("jamMasuk").value,
            jamPulang: document.getElementById("jamPulang").value,
            pembimbing: document.getElementById("pembimbing").value,
            kegiatan: document.getElementById("kegiatan").value,
            hasil: document.getElementById("hasil").value,
            kendala: document.getElementById("kendala").value,
            solusi: document.getElementById("solusi").value,
            status: document.getElementById("status").value,
            foto: fotoBase64 || (editIndex !== null ? jurnalData[editIndex].foto : "")
        };

        if (editIndex !== null) {
            // Mode Update/Edit Data Lama
            jurnalData[editIndex] = obj;
            editIndex = null;
            document.getElementById("formTitle").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Tambah Jurnal`;
            document.getElementById("saveBtn").innerHTML = `<i class="fa-solid fa-floppy-disk"></i> Simpan Jurnal`;
            alert("Jurnal Berhasil Diperbarui!");
        } else {
            // Mode Entry Baru
            jurnalData.push(obj);
            alert("Jurnal Berhasil Disimpan!");
        }

        localStorage.setItem("jurnalPKL", JSON.stringify(jurnalData));
        jurnalForm.reset();
        
        // Kembalikan tanggal ke hari ini setelah reset form
        const hariIni = new Date();
        tglInput.value = `${hariIni.getFullYear()}-${String(hariIni.getMonth() + 1).padStart(2, '0')}-${String(hariIni.getDate()).padStart(2, '0')}`;
        hariInput.value = hariIndonesia[hariIni.getDay()];
        if (jurnalData.length > 0) document.getElementById("pembimbing").value = obj.pembimbing;

        render();
    };

    if (file) {
        const reader = new FileReader();
        reader.onload = () => simpanProses(reader.result);
        reader.readAsDataURL(file);
    } else {
        simpanProses("");
    }
});

// Render UI Riwayat List & Dashboard Analytics
function render() {
    const keyword = searchInput.value.toLowerCase();
    const bulan = filterBulan.value;

    let hasilFilter = jurnalData.filter(item => {
        const cocokCari = item.kegiatan.toLowerCase().includes(keyword) || item.hasil.toLowerCase().includes(keyword);
        const cocokBulan = bulan === "" || item.tanggal.split("-")[1] === bulan;
        return cocokCari && cocokBulan;
    });

    journalList.innerHTML = "";
    let totalJamKerja = 0;

    hasilFilter.forEach((item, index) => {
        totalJamKerja += hitungJam(item.jamMasuk, item.jamPulang);
        
        // Format Tanggal Indonesia (YYYY-MM-DD -> DD-MM-YYYY)
        const tglSplit = item.tanggal.split("-");
        const tglIndo = tglSplit.length === 3 ? `${tglSplit[2]}-${tglSplit[1]}-${tglSplit[0]}` : item.tanggal;

        journalList.innerHTML += `
            <div class="glass journal-card">
                <span class="badge">${item.status}</span>
                <h3>${item.kegiatan}</h3>
                <div class="card-meta">
                    <span><i class="fa-solid fa-calendar-days"></i> ${item.hari}, ${tglIndo}</span> | 
                    <span><i class="fa-solid fa-clock"></i> ${item.jamMasuk} - ${item.jamPulang}</span>
                </div>
                <p><b>👨‍🏫 Pembimbing:</b> ${item.pembimbing}</p>
                <p><b>📝 Hasil Kerja:</b> ${item.hasil}</p>
                <p><b>⚠️ Kendala:</b> ${item.kendala}</p>
                <p><b>💡 Solusi:</b> ${item.solusi}</p>
                ${item.foto ? `<img src="${item.foto}" class="photo" alt="Dokumentasi">` : ""}
                <div style="margin-top:15px; display:flex; gap:10px;">
                    <button class="primary" onclick="siapkanEdit(${index})"><i class="fa-solid fa-pencil"></i> Edit</button>
                    <button class="danger" onclick="hapusJurnal(${index})"><i class="fa-solid fa-trash"></i> Hapus</button>
                </div>
            </div>
        `;
    });

    // Update Counter Dashboard Atas
    document.getElementById("totalJurnal").innerText = jurnalData.length;
    document.getElementById("totalHari").innerText = new Set(jurnalData.map(x => x.tanggal)).size;
    document.getElementById("totalPembimbing").innerText = new Set(jurnalData.map(x => x.pembimbing.toLowerCase().trim())).size;
    document.getElementById("totalJam").innerText = Math.round(totalJamKerja);

    buatChart();
}

// Masuk ke Mode Edit Data
function siapkanEdit(index) {
    editIndex = index;
    const item = jurnalData[index];

    tglInput.value = item.tanggal;
    hariInput.value = item.hari;
    document.getElementById("jamMasuk").value = item.jamMasuk;
    document.getElementById("jamPulang").value = item.jamPulang;
    document.getElementById("pembimbing").value = item.pembimbing;
    document.getElementById("kegiatan").value = item.kegiatan;
    document.getElementById("hasil").value = item.hasil;
    document.getElementById("kendala").value = item.kendala;
    document.getElementById("solusi").value = item.solusi;
    document.getElementById("status").value = item.status;

    document.getElementById("formTitle").innerHTML = `<i class="fa-solid fa-pencil"></i> Edit Jurnal Hari ${item.hari}`;
    document.getElementById("saveBtn").innerHTML = `<i class="fa-solid fa-file-pen"></i> Perbarui Data Jurnal`;
    
    // Gulir layar otomatis langsung menuju ke Form Pengisian
    document.getElementById("formSection").scrollIntoView({ behavior: 'smooth' });
}

function hapusJurnal(index) {
    if (confirm("Apakah kamu yakin mau menghapus arsip jurnal ini?")) {
        jurnalData.splice(index, 1);
        localStorage.setItem("jurnalPKL", JSON.stringify(jurnalData));
        render();
    }
}

// Pembuat Grafik Menggunakan Chart.js (Dinonaktifkan Animasi Lambatnya Biar Enteng di HP)
function buatChart() {
    const bulanMap = {};
    jurnalData.forEach(item => {
        const bln = item.tanggal.substring(0, 7); // Format: YYYY-MM
        bulanMap[bln] = (bulanMap[bln] || 0) + 1;
    });

    const labels = Object.keys(bulanMap).sort();
    const values = labels.map(lbl => bulanMap[lbl]);

    const isDark = document.body.classList.contains("dark");
    const textColor = isDark ? "#f8fafc" : "#0f172a";

    const ctx = document.getElementById("activityChart").getContext("2d");
    if (chart) chart.destroy();

    chart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Intensitas Input Kegiatan",
                data: values,
                backgroundColor: "rgba(37, 99, 235, 0.7)",
                borderColor: "#2563eb",
                borderWidth: 1,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { 
                    ticks: { color: textColor },
                    grid: { color: isDark ? "#334155" : "#cbd5e1" }
                },
                x: { 
                    ticks: { color: textColor },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { labels: { color: textColor } }
            }
        }
    });
}

// Filter Pencarian Realtime
searchInput.addEventListener("input", render);
filterBulan.addEventListener("change", render);

// Dark Mode Toggle Switcher
darkBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark"));
    render(); // Re-render chart agar teks ikut berubah warna
});
if (localStorage.getItem("theme") === "true") {
    document.body.classList.add("dark");
}

// Floating Action Button (FAB) Trigger scroll
document.getElementById("fabBtn").addEventListener("click", () => {
    document.getElementById("formSection").scrollIntoView({ behavior: 'smooth' });
});

// JSON Backup Data
document.getElementById("backupBtn").addEventListener("click", () => {
    if(jurnalData.length === 0) return alert("Belum ada data untuk di-backup!");
    const blob = new Blob([JSON.stringify(jurnalData, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `BackupJurnal_ZulAnnas_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
});

// JSON Restore Data
document.getElementById("triggerRestore").addEventListener("click", () => document.getElementById("restoreFile").click());
document.getElementById("restoreFile").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const parsedData = JSON.parse(reader.result);
            if (Array.isArray(parsedData)) {
                jurnalData = parsedData;
                localStorage.setItem("jurnalPKL", JSON.stringify(jurnalData));
                render();
                alert("Data Jurnal Berhasil Dipulihkan (Restore Sukses)!");
            } else { alert("Struktur file data tidak cocok!"); }
        } catch { alert("Gagal membaca file JSON."); }
    };
    reader.readAsText(file);
});

// EKSPOR PDF PROFESIONAL DENGAN FORMAT TABEL (MENGGUNAKAN AUTOTABLE)
document.getElementById("exportBtn").addEventListener("click", () => {
    if(jurnalData.length === 0) return alert("Tidak ada data jurnal untuk diekspor ke PDF.");
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l', 'mm', 'a4'); // Mode Landscape biar muat tabel banyak kolom

    // Judul Dokumen Utama
    doc.setFont("Poppins", "bold");
    doc.setFontSize(16);
    doc.text("LAPORAN JURNAL AKTIVITAS PRAKTIK KERJA LAPANGAN (PKL)", 14, 15);
    
    doc.setFontSize(11);
    doc.setFont("Helvetica", "normal");
    doc.text(`Nama Siswa : Zul Annas`, 14, 23);
    doc.text(`Jurusan        : Teknik Komputer dan Jaringan (TKJ) - SMK Swadhipa 2 Natar`, 14, 28);
    doc.text(`Tempat PKL : PT Megarap Mitra Solusi Bumisari Natar`, 14, 33);

    // Siapkan Row Data untuk Dimasukkan ke Tabel
    const tableRows = [];
    jurnalData.forEach((item, index) => {
        const tglSplit = item.tanggal.split("-");
        const tglIndo = `${tglSplit[2]}/${tglSplit[1]}/${tglSplit[0]}`;
        
        const rowData = [
            index + 1,
            `${item.hari}, ${tglIndo}`,
            `${item.jamMasuk} - ${item.jamPulang}`,
            item.pembimbing,
            item.kegiatan,
            item.hasil,
            item.kendala,
            item.solusi,
            item.status
        ];
        tableRows.push(rowData);
    });

    // Struktur Header Tabel Laporan
    const tableHeaders = [["No", "Hari, Tanggal", "Waktu", "Pembimbing", "Kegiatan Kerja", "Hasil Pekerjaan", "Kendala", "Solusi", "Status"]];

    // Generate Tabel Menggunakan Plugin autoTable
    doc.autoTable({
        head: tableHeaders,
        body: tableRows,
        startY: 38,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235], fontSize: 9, halign: 'center' },
        bodyStyles: { fontSize: 8.5, textColor: [15, 23, 42] },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' }, // No
            1: { cellWidth: 30 },                  // Tanggal
            2: { cellWidth: 22, halign: 'center' }, // Waktu
            3: { cellWidth: 30 },                  // Pembimbing
            4: { cellWidth: 45 },                  // Kegiatan
            5: { cellWidth: 45 },                  // Hasil
            6: { cellWidth: 32 },                  // Kendala
            7: { cellWidth: 32 },                  // Solusi
            8: { cellWidth: 20, halign: 'center' }  // Status
        },
        styles: { overflow: 'bleed' }
    });

    doc.save("Laporan_Jurnal_PKL_ZulAnnas.pdf");
});
