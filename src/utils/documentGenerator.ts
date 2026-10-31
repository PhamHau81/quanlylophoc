import { ClassConfig, ReportItem, Student } from '../types';

/**
 * Triggers a download of arbitrary content as a file in the browser
 */
export function triggerFileDownload(filename: string, content: string | Blob, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Dynamically loads an external script from CDN if not already loaded
 */
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Generates an official Microsoft Word (.doc) document adhering to standard Vietnamese administrative formats
 * (Fallback & universal compatibility mode)
 */
export function generateWordDocument(
  docType: 'INVITATION' | 'VIOLATION' | 'SUMMARY_REPORT',
  data: {
    config: ClassConfig;
    student?: Student;
    reason?: string;
    meetingTime?: string;
    meetingLocation?: string;
    history?: ReportItem[];
    timeRangeText?: string;
  }
) {
  const { config, student, reason, meetingTime, meetingLocation, history, timeRangeText } = data;
  const now = new Date();
  const dateFormatted = `ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

  let title = '';
  let filename = '';
  let bodyContent = '';

  if (docType === 'INVITATION') {
    title = 'GIẤY MỜI PHỤ HUYNH HỌC SINH';
    filename = `Giay_Moi_PH_${student?.name ? student.name.replace(/\s+/g, '_') : 'HocSinh'}.doc`;
    bodyContent = `
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="font-size: 16pt; font-weight: bold; margin: 0; color: #1e3a8a;">GIẤY MỜI PHỤ HUYNH HỌC SINH</h2>
        <p style="font-style: italic; font-size: 11pt; margin-top: 5px;">(V/v: Trao đổi tình hình học tập và rèn luyện của học sinh)</p>
      </div>

      <p style="text-indent: 24pt; line-height: 1.6; font-size: 12pt;">
        <strong>Kính gửi:</strong> Ông/Bà là Phụ huynh của em: <strong>${student?.name || '................................................'}</strong>
      </p>
      <p style="text-indent: 24pt; line-height: 1.6; font-size: 12pt;">
        Học sinh lớp: <strong>${config.className}</strong> - Trường: <strong>${config.schoolName}</strong>
      </p>

      <p style="text-indent: 24pt; line-height: 1.6; font-size: 12pt;">
        Ban giám hiệu và Giáo viên chủ nhiệm lớp trân trọng kính mời Ông/Bà đến trường để trao đổi về tình hình học tập và nề nếp của học sinh.
      </p>

      <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; margin: 15px 0; border-radius: 6px;">
        <p style="margin: 6px 0; font-size: 12pt;">⏰ <strong>Thời gian:</strong> ${meetingTime || '08 giờ 30 phút, ngày ..... tháng ..... năm 2026'}</p>
        <p style="margin: 6px 0; font-size: 12pt;">📍 <strong>Địa điểm:</strong> ${meetingLocation || 'Phòng học lớp ' + config.className + ' hoặc Văn phòng Đoàn trường'}</p>
        <p style="margin: 6px 0; font-size: 12pt;">📝 <strong>Nội dung trao đổi:</strong> ${reason || 'Phối hợp gia đình và nhà trường đôn đốc nề nếp, ý thức học tập và chuyên cần của học sinh.'}</p>
      </div>

      <p style="text-indent: 24pt; line-height: 1.6; font-size: 12pt;">
        Rất mong Ông/Bà sắp xếp thời gian đến đúng giờ để buổi làm việc đạt kết quả tốt nhất. Sự phối hợp của quý phụ huynh là nhân tố quyết định đến sự tiến bộ của học sinh.
      </p>
      <p style="text-indent: 24pt; line-height: 1.6; font-size: 12pt;">
        Xin trân trọng cảm ơn!
      </p>

      <table style="width: 100%; margin-top: 35px; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: top; font-size: 12pt;">
            <strong>Ý KIẾN PHỤ HUYNH</strong><br/>
            <span style="font-size: 10pt; font-style: italic;">(Ký và ghi rõ họ tên)</span>
            <div style="height: 80px;"></div>
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top; font-size: 12pt;">
            <em>Hà Nội, ${dateFormatted}</em><br/>
            <strong>GIÁO VIÊN CHỦ NHIỆM</strong><br/>
            <span style="font-size: 10pt; font-style: italic;">(Ký và ghi rõ họ tên)</span>
            <div style="height: 70px;"></div>
            <strong style="font-size: 13pt; color: #1e3a8a;">${config.teacherName}</strong>
          </td>
        </tr>
      </table>
    `;
  } else if (docType === 'VIOLATION') {
    title = 'BIÊN BẢN VI PHẠM KỶ LUẬT VÀ CAM KẾT RÈN LUYỆN';
    filename = `Bien_Ban_Vi_Pham_${student?.name ? student.name.replace(/\s+/g, '_') : 'HocSinh'}.doc`;
    bodyContent = `
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="font-size: 16pt; font-weight: bold; margin: 0; color: #b91c1c;">BIÊN BẢN VI PHẠM NỘI QUY VÀ CAM KẾT RÈN LUYỆN</h2>
        <p style="font-style: italic; font-size: 11pt; margin-top: 5px;">Học kỳ I / Năm học 2025 - 2026</p>
      </div>

      <p style="line-height: 1.6; font-size: 12pt;">
        Hôm nay, vào hồi ..... giờ ..... ngày ..... tháng ..... năm 2026, tại phòng học lớp ${config.className}, chúng tôi gồm có:
      </p>
      <p style="line-height: 1.6; font-size: 12pt; margin-left: 20px;">
        1. Thầy/Cô: <strong>${config.teacherName}</strong> - Giáo viên chủ nhiệm lớp ${config.className}<br/>
        2. Em: <strong>${config.reporterName}</strong> - Chức vụ: ${config.reporterRole}<br/>
        3. Học sinh vi phạm: <strong>${student?.name || '................................................'}</strong> - Lớp ${config.className}
      </p>

      <p style="line-height: 1.6; font-size: 12pt; font-weight: bold; margin-top: 15px;">
        I. NỘI DUNG VI PHẠM ĐÃ GHI NHẬN:
      </p>
      <div style="border: 1px solid #cbd5e1; padding: 12px; background: #fff5f5; font-size: 12pt; border-radius: 4px;">
        ${reason || 'Vi phạm nề nếp chuyên cần lớp học nhiều lần, chưa tự giác hoàn thành nhiệm vụ được giao.'}
      </div>

      <p style="line-height: 1.6; font-size: 12pt; font-weight: bold; margin-top: 15px;">
        II. BẢN TỰ KIỂM ĐIỂM & CAM KẾT CỦA HỌC SINH:
      </p>
      <p style="text-indent: 24pt; line-height: 1.6; font-size: 12pt;">
        Em nhận thấy hành vi vi phạm của mình đã làm ảnh hưởng đến nề nếp và thi đua chung của tập thể lớp ${config.className}. Em xin nhận khuyết điểm và xin cam kết:
      </p>
      <ol style="margin-left: 30px; line-height: 1.6; font-size: 12pt;">
        <li>Tuyệt đối chấp hành nghiêm chỉnh nội quy của nhà trường và lớp học.</li>
        <li>Đi học đúng giờ, chuyên cần, học bài và làm bài tập đầy đủ trước khi đến lớp.</li>
        <li>Nếu tái phạm, em xin chịu mọi hình thức kỷ luật theo quy định của nhà trường.</li>
      </ol>

      <p style="line-height: 1.6; font-size: 12pt; font-weight: bold; margin-top: 15px;">
        III. Ý KIẾN CỦA GIÁO VIÊN CHỦ NHIỆM:
      </p>
      <p style="text-indent: 24pt; line-height: 1.6; font-size: 12pt;">
        Nhắc nhở học sinh nghiêm túc rút kinh nghiệm, yêu cầu gia đình phối hợp đôn đốc nhắc nhở học sinh hàng ngày.
      </p>

      <table style="width: 100%; margin-top: 35px; border-collapse: collapse;">
        <tr>
          <td style="width: 33%; text-align: center; vertical-align: top; font-size: 11pt;">
            <strong>HỌC SINH VI PHẠM</strong><br/>
            <span style="font-size: 9pt; font-style: italic;">(Ký và ghi rõ họ tên)</span>
            <div style="height: 70px;"></div>
            <strong>${student?.name || ''}</strong>
          </td>
          <td style="width: 33%; text-align: center; vertical-align: top; font-size: 11pt;">
            <strong>ĐẠI DIỆN BAN CÁN SỰ</strong><br/>
            <span style="font-size: 9pt; font-style: italic;">(Ký và ghi rõ họ tên)</span>
            <div style="height: 70px;"></div>
            <strong>${config.reporterName}</strong>
          </td>
          <td style="width: 34%; text-align: center; vertical-align: top; font-size: 11pt;">
            <strong>GIÁO VIÊN CHỦ NHIỆM</strong><br/>
            <span style="font-size: 9pt; font-style: italic;">(Ký và ghi rõ họ tên)</span>
            <div style="height: 70px;"></div>
            <strong style="color: #1e3a8a;">${config.teacherName}</strong>
          </td>
        </tr>
      </table>
    `;
  } else {
    title = 'BÁO CÁO TỔNG HỢP NỀ NẾP & CHUYÊN CẦN';
    filename = `Bao_Cao_Tong_Hop_Lop_${config.className}.doc`;
    const reportList = history || [];
    bodyContent = `
      <div style="text-align: center; margin-bottom: 25px;">
        <h2 style="font-size: 16pt; font-weight: bold; margin: 0; color: #1e3a8a;">BÁO CÁO TỔNG HỢP NỀ NẾP & CHUYÊN CẦN</h2>
        <p style="font-style: italic; font-size: 11pt; margin-top: 5px;">Lớp: ${config.className} | GVCN: ${config.teacherName} | ${timeRangeText || 'Thời gian: Toàn kỳ'}</p>
      </div>

      <p style="line-height: 1.6; font-size: 12pt;">
        Tổng số sự việc/ghi nhận đã lưu: <strong>${reportList.length}</strong> lượt.
      </p>

      <table border="1" cellpadding="6" cellspacing="0" style="width: 100%; border-collapse: collapse; font-size: 11pt; border: 1px solid #333; margin-top: 15px;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: center; font-weight: bold;">
            <th style="width: 35px;">STT</th>
            <th style="width: 90px;">Ngày</th>
            <th style="width: 75px;">Tiết/Môn</th>
            <th style="width: 90px;">Phân loại</th>
            <th style="width: 160px;">Học sinh</th>
            <th>Nội dung chi tiết</th>
          </tr>
        </thead>
        <tbody>
          ${reportList.map((item, idx) => {
            const studentNames = item.students.map(s => s.name).join(', ') || 'Cả lớp';
            let typeLabel = 'Vắng học';
            if (item.type === 'VIOLATION') typeLabel = 'Vi phạm';
            if (item.type === 'COMMENDATION') typeLabel = 'Tuyên dương';
            const details = [
              ...item.violationTags,
              ...item.commendationTags,
              item.customNote
            ].filter(Boolean).join('; ');

            return `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td style="text-align: center;">${item.dateDisplay || item.date}</td>
                <td style="text-align: center;">${item.period} ${item.subject ? `(${item.subject})` : ''}</td>
                <td style="text-align: center; font-weight: bold;">${typeLabel}</td>
                <td>${studentNames}</td>
                <td>${details || 'Không có ghi chú thêm'}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <table style="width: 100%; margin-top: 40px; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; text-align: center; vertical-align: top; font-size: 12pt;">
            <strong>NGƯỜI LẬP BÁO CÁO</strong><br/>
            <span style="font-size: 10pt; font-style: italic;">(${config.reporterRole})</span>
            <div style="height: 70px;"></div>
            <strong>${config.reporterName}</strong>
          </td>
          <td style="width: 50%; text-align: center; vertical-align: top; font-size: 12pt;">
            <em>Ngày ${dateFormatted}</em><br/>
            <strong>GIÁO VIÊN CHỦ NHIỆM</strong><br/>
            <span style="font-size: 10pt; font-style: italic;">(Ký duyệt)</span>
            <div style="height: 70px;"></div>
            <strong style="color: #1e3a8a;">${config.teacherName}</strong>
          </td>
        </tr>
      </table>
    `;
  }

  const fullHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
          <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
      </xml>
      <![endif]-->
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          margin: 20mm 20mm 20mm 25mm;
          font-size: 12pt;
          color: #111;
        }
        @page {
          size: A4;
          margin: 20mm 20mm 20mm 25mm;
        }
      </style>
    </head>
    <body>
      <!-- QUỐC HIỆU TIÊU NGỮ TIÊU CHUẨN VIỆT NAM -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="width: 45%; text-align: center; vertical-align: top;">
            <strong style="font-size: 11pt; text-transform: uppercase;">${config.schoolName}</strong><br/>
            <strong style="font-size: 11pt;">LỚP: ${config.className}</strong><br/>
            <div style="width: 90px; border-bottom: 1px solid #333; margin: 3px auto;"></div>
          </td>
          <td style="width: 55%; text-align: center; vertical-align: top;">
            <strong style="font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</strong><br/>
            <strong style="font-size: 11pt;">Độc lập - Tự do - Hạnh phúc</strong><br/>
            <div style="width: 140px; border-bottom: 1px solid #333; margin: 3px auto;"></div>
          </td>
        </tr>
      </table>

      ${bodyContent}
    </body>
    </html>
  `;

  triggerFileDownload(filename, fullHtml, 'application/msword;charset=utf-8');
}

/**
 * Slide data definition for presentation
 */
export interface SlideItem {
  title: string;
  subtitle?: string;
  contentHtml: string;
  tag?: string;
}

/**
 * Generates an interactive web slide deck that can be viewed full-screen in a popup
 * or downloaded as an offline HTML file
 */
export function openPresentationViewer(presentationTitle: string, slides: SlideItem[]) {
  const slidesJson = JSON.stringify(slides);
  const viewerHtml = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${presentationTitle}</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
      </style>
    </head>
    <body class="bg-slate-950 text-white min-h-screen flex flex-col justify-between overflow-hidden select-none">
      <!-- TOP NAV -->
      <header class="p-4 px-6 flex items-center justify-between border-b border-slate-800 bg-slate-900/50 backdrop-blur">
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <h1 class="text-sm font-bold text-slate-200 tracking-wide">${presentationTitle}</h1>
        </div>
        <div class="flex items-center gap-3 text-xs text-slate-400">
          <span>Phím ⬅️ ➡️ hoặc Phím Cách để chuyển slide</span>
          <button onclick="toggleFullScreen()" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium border border-slate-700 transition">
            ⛶ Toàn màn hình
          </button>
        </div>
      </header>

      <!-- SLIDE CONTAINER -->
      <main class="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-12 flex flex-col justify-center">
        <div id="slideBox" class="bg-gradient-to-br from-slate-900 to-slate-850 border border-slate-700/80 rounded-3xl p-8 sm:p-14 shadow-2xl transition-all duration-300">
          <!-- Dynamic Slide Content -->
        </div>
      </main>

      <!-- BOTTOM CONTROL BAR -->
      <footer class="p-4 px-8 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <button onclick="prevSlide()" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1">
            ◀ Trước
          </button>
          <button onclick="nextSlide()" class="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 flex items-center gap-1">
            Tiếp theo ▶
          </button>
        </div>

        <div class="text-xs font-semibold text-slate-400">
          Slide <span id="currentIdx" class="text-white text-sm">1</span> / <span id="totalIdx"></span>
        </div>
      </footer>

      <script>
        const slides = ${slidesJson};
        let current = 0;

        function renderSlide() {
          const s = slides[current];
          const box = document.getElementById('slideBox');
          document.getElementById('currentIdx').innerText = current + 1;
          document.getElementById('totalIdx').innerText = slides.length;

          box.innerHTML = \`
            \${s.tag ? \`<div class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 mb-4">\${s.tag}</div>\` : ''}
            <h2 class="text-2xl sm:text-4xl font-extrabold text-white mb-2 leading-tight">\${s.title}</h2>
            \${s.subtitle ? \`<p class="text-sm sm:text-base text-blue-300 font-medium mb-6">\${s.subtitle}</p>\` : '<div class="mb-6"></div>'}
            <div class="text-sm sm:text-base text-slate-300 leading-relaxed space-y-4">
              \${s.contentHtml}
            </div>
          \`;
        }

        function nextSlide() {
          if (current < slides.length - 1) {
            current++;
            renderSlide();
          }
        }

        function prevSlide() {
          if (current > 0) {
            current--;
            renderSlide();
          }
        }

        function toggleFullScreen() {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
        }

        window.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
            nextSlide();
          } else if (e.key === 'ArrowLeft') {
            prevSlide();
          }
        });

        renderSlide();
      </script>
    </body>
    </html>
  `;

  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(viewerHtml);
    newWindow.document.close();
  }
}

/**
 * Generates an authentic Microsoft PowerPoint (.pptx) file client-side using PptxGenJS (from pptx-official skill)
 */
export async function generatePowerPointPresentation(
  slideType: 'PARENT' | 'CLASS',
  data: {
    config: ClassConfig;
    history: ReportItem[];
  }
): Promise<void> {
  const { config, history } = data;

  // Load PptxGenJS dynamically if not present
  if (typeof (window as any).PptxGenJS === 'undefined') {
    await loadScript('https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js');
  }

  const PptxGenJS = (window as any).PptxGenJS;
  if (!PptxGenJS) {
    throw new Error('Không thể tải thư viện PptxGenJS. Vui lòng kiểm tra kết nối mạng!');
  }

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = config.teacherName || 'Giáo viên chủ nhiệm';
  pptx.company = config.schoolName || 'Trường học';

  const totalViolations = history.filter(h => h.type === 'VIOLATION').length;
  const totalCommendations = history.filter(h => h.type === 'COMMENDATION').length;
  const totalAbsents = history.filter(h => h.type === 'ABSENT').length;

  if (slideType === 'PARENT') {
    pptx.title = `Họp Phụ Huynh Lớp ${config.className}`;

    // SLIDE 1: Title Slide
    const s1 = pptx.addSlide();
    s1.background = { color: '0F172A' }; // Dark Slate
    s1.addText('HỘI NGHỊ BAN ĐẠI DIỆN CHA MẸ HỌC SINH', {
      x: 1.0, y: 1.2, w: '85%', h: 0.5,
      fontSize: 16, color: '38BDF8', bold: true, align: 'center'
    });
    s1.addText(`HỌP PHỤ HUYNH LỚP ${config.className}`, {
      x: 1.0, y: 2.0, w: '85%', h: 1.2,
      fontSize: 34, color: 'FFFFFF', bold: true, align: 'center'
    });
    s1.addText(`${config.schoolName} • Năm học 2025 - 2026\nGiáo viên chủ nhiệm: ${config.teacherName} (SĐT: ${config.zaloPhone || 'N/A'})`, {
      x: 1.0, y: 3.6, w: '85%', h: 1.0,
      fontSize: 15, color: '94A3B8', align: 'center'
    });

    // SLIDE 2: Tổng quan nề nếp
    const s2 = pptx.addSlide();
    s2.background = { color: 'F8FAFC' };
    s2.addText(`BÁO CÁO TỔNG QUAN NỀ NẾP & CHUYÊN CẦN`, {
      x: 0.8, y: 0.5, w: '90%', h: 0.6,
      fontSize: 22, color: '1E3A8A', bold: true
    });
    s2.addText(`Lớp: ${config.className} | GVCN: ${config.teacherName}`, {
      x: 0.8, y: 1.1, w: '90%', h: 0.4,
      fontSize: 13, color: '64748B'
    });

    // KPI Cards
    s2.addShape(pptx.ShapeType.roundRect, { x: 0.8, y: 1.8, w: 2.8, h: 1.8, fill: { color: 'EFF6FF' }, line: { color: '3B82F6', width: 1.5 } });
    s2.addText('SĨ SỐ LỚP', { x: 0.8, y: 2.0, w: 2.8, h: 0.3, fontSize: 12, color: '1E40AF', bold: true, align: 'center' });
    s2.addText(`${config.students.length}`, { x: 0.8, y: 2.4, w: 2.8, h: 0.8, fontSize: 32, color: '1D4ED8', bold: true, align: 'center' });

    s2.addShape(pptx.ShapeType.roundRect, { x: 3.9, y: 1.8, w: 2.8, h: 1.8, fill: { color: 'ECFDF5' }, line: { color: '10B981', width: 1.5 } });
    s2.addText('LƯỢT KHEN THƯỞNG', { x: 3.9, y: 2.0, w: 2.8, h: 0.3, fontSize: 12, color: '065F46', bold: true, align: 'center' });
    s2.addText(`+${totalCommendations}`, { x: 3.9, y: 2.4, w: 2.8, h: 0.8, fontSize: 32, color: '047857', bold: true, align: 'center' });

    s2.addShape(pptx.ShapeType.roundRect, { x: 7.0, y: 1.8, w: 2.8, h: 1.8, fill: { color: 'FFFBEB' }, line: { color: 'F59E0B', width: 1.5 } });
    s2.addText('LƯỢT VI PHẠM/NHẮC NHỞ', { x: 7.0, y: 2.0, w: 2.8, h: 0.3, fontSize: 12, color: '92400E', bold: true, align: 'center' });
    s2.addText(`${totalViolations}`, { x: 7.0, y: 2.4, w: 2.8, h: 0.8, fontSize: 32, color: 'D97706', bold: true, align: 'center' });

    s2.addText([
      { text: '🌟 Ưu điểm: ', options: { bold: true, color: '047857' } },
      { text: 'Đa số các em có ý thức chấp hành tốt nội quy, đoàn kết, chăm chỉ xây dựng bài.\n' },
      { text: '⚠️ Lưu ý: ', options: { bold: true, color: 'B91C1C' } },
      { text: 'Một số em còn tình trạng đi học muộn vào tiết 1, còn quên chuẩn bị bài tập về nhà.' }
    ], { x: 0.8, y: 4.0, w: '90%', h: 1.2, fontSize: 13, color: '334155' });

    // SLIDE 3: Phối hợp gia đình và nhà trường
    const s3 = pptx.addSlide();
    s3.background = { color: '0F172A' };
    s3.addText('PHƯƠNG HƯỚNG PHỐI HỢP VỚI GIA ĐÌNH', {
      x: 0.8, y: 0.8, w: '90%', h: 0.6,
      fontSize: 24, color: '38BDF8', bold: true
    });
    s3.addText([
      { text: '1. Quản lý thời gian biểu tại nhà: ', options: { bold: true, color: 'F8FAFC' } },
      { text: 'Nhắc nhở học sinh chuẩn bị bài và đồ dùng học tập trước khi đi ngủ, hạn chế dùng điện thoại khuya.\n\n', options: { color: 'CBD5E1' } },
      { text: '2. Tương tác chặt chẽ qua Zalo: ', options: { bold: true, color: 'F8FAFC' } },
      { text: 'Mọi thông tin nề nếp, chuyên cần được GVCN gửi trực tiếp qua tin nhắn Zalo đến từng phụ huynh.\n\n', options: { color: 'CBD5E1' } },
      { text: '3. Kênh liên hệ trực tiếp GVCN: ', options: { bold: true, color: 'F8FAFC' } },
      { text: `Thầy/Cô: ${config.teacherName} • Số điện thoại Zalo: ${config.zaloPhone || 'N/A'}. Luôn sẵn sàng đồng hành cùng quý cha mẹ!`, options: { color: 'CBD5E1' } },
    ], { x: 0.8, y: 1.8, w: '85%', h: 3.0, fontSize: 14 });

    await pptx.writeFile({ fileName: `Slide_Hop_Phu_Huynh_${config.className}.pptx` });

  } else {
    pptx.title = `Sinh Hoạt Lớp ${config.className}`;

    // SLIDE 1: Title Slide
    const s1 = pptx.addSlide();
    s1.background = { color: '1E1B4B' }; // Deep Indigo
    s1.addText('TIẾT SINH HOẠT LỚP HÀNG TUẦN', {
      x: 1.0, y: 1.2, w: '85%', h: 0.5,
      fontSize: 16, color: '818CF8', bold: true, align: 'center'
    });
    s1.addText(`SINH HOẠT LỚP ${config.className}`, {
      x: 1.0, y: 2.0, w: '85%', h: 1.2,
      fontSize: 36, color: 'FFFFFF', bold: true, align: 'center'
    });
    s1.addText(`Chủ trì: Thầy ${config.teacherName} • Báo cáo: ${config.reporterName} (${config.reporterRole})`, {
      x: 1.0, y: 3.6, w: '85%', h: 0.8,
      fontSize: 16, color: 'C7D2FE', align: 'center'
    });

    // SLIDE 2: Thi đua 4 Tổ
    const s2 = pptx.addSlide();
    s2.background = { color: 'F8FAFC' };
    s2.addText('SƠ KẾT THI ĐUA NỀ NẾP CÁC TỔ', {
      x: 0.8, y: 0.5, w: '90%', h: 0.6,
      fontSize: 22, color: '1E3A8A', bold: true
    });

    const groups = [1, 2, 3, 4];
    groups.forEach((g, idx) => {
      const xPos = 0.8 + idx * 2.3;
      s2.addShape(pptx.ShapeType.roundRect, { x: xPos, y: 1.5, w: 2.1, h: 2.4, fill: { color: 'FFFFFF' }, line: { color: 'CBD5E1', width: 1 } });
      s2.addText(`TỔ ${g}`, { x: xPos, y: 1.7, w: 2.1, h: 0.4, fontSize: 16, bold: true, color: '1E3A8A', align: 'center' });
      s2.addText(`Thi đua xuất sắc\nĐoàn kết tốt\nTrực nhật sạch sẽ`, { x: xPos, y: 2.3, w: 2.1, h: 1.2, fontSize: 11, color: '475569', align: 'center' });
    });

    // SLIDE 3: Nhiệm vụ tuần mới
    const s3 = pptx.addSlide();
    s3.background = { color: '0F172A' };
    s3.addText('KẾ HOẠCH & NHIỆM VỤ TRỌNG TÂM TUẦN MỚI', {
      x: 0.8, y: 0.8, w: '90%', h: 0.6,
      fontSize: 22, color: '38BDF8', bold: true
    });
    s3.addText([
      { text: '✅ 100% học sinh đi học đúng giờ, sơ vin chỉnh tề, đeo phù hiệu đầy đủ.\n\n' },
      { text: '✅ Hoàn thành 100% bài tập về nhà trước khi đến lớp, tích cực giơ tay phát biểu.\n\n' },
      { text: '✅ Tuyệt đối không sử dụng điện thoại trong giờ học khi chưa có lệnh của giáo viên.\n\n' },
      { text: '✅ Trực nhật sạch sẽ, tắt điện và đóng cửa sổ cẩn thận trước khi ra về.' }
    ], { x: 0.8, y: 1.8, w: '85%', h: 2.5, fontSize: 14, color: 'F1F5F9', bold: true });

    s3.addText(`"CHÚC TẬP THỂ LỚP ${config.className} ĐOẠT DANH HIỆU LỚP TIÊN TIẾN TUẦN TỚI!"`, {
      x: 0.8, y: 4.5, w: '85%', h: 0.6,
      fontSize: 16, color: 'FDE047', bold: true, align: 'center'
    });

    await pptx.writeFile({ fileName: `Slide_Sinh_Hoat_Lop_${config.className}.pptx` });
  }
}
