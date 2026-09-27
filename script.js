// Danh sach cau hoi
const questions = [
    {
        question: "1. Để quản lý mã nguồn và file cấu hình trên GitHub đạt chuẩn, bạn cần làm gì?",
        options: [
            "Chỉ tải file lên nhánh master",
            "Có đủ 3 commit, source + cấu hình và README hướng dẫn chạy",
            "Code xong để trong máy, khi nào báo cáo thì zip lại",
            "Chỉ cần viết file README.md là đủ"
        ],
        correct: 1
    },
    {
        question: "2. Khi triển khai ứng dụng và Database, công cụ nào thường dùng để quản lý MySQL?",
        options: ["phpMyAdmin", "pgAdmin", "Nginx", "Prometheus"],
        correct: 0
    },
    {
        question: "3. Nginx Reverse Proxy được yêu cầu cấu hình thêm tính năng gì để đảm bảo bảo mật cơ bản?",
        options: [
            "HTTPS tự ký hoặc Security Headers",
            "Chặn toàn bộ IP nước ngoài",
            "Mở port 80 cho tất cả mọi người",
            "Gửi email cảnh báo khi có người truy cập"
        ],
        correct: 0
    },
    {
        question: "4. Cặp đôi hoàn hảo nào được dùng để giám sát (monitor) container, web và database trong đề tài?",
        options: ["Loki + Promtail", "Nginx + Apache", "Prometheus + Grafana", "Docker + Kubernetes"],
        correct: 2
    },
    {
        question: "5. Để truy vấn log tập trung từ Loki, bạn cần sử dụng ngôn ngữ truy vấn nào?",
        options: ["SQL", "NoSQL", "LogQL", "GraphQL"],
        correct: 2
    },
    {
        question: "6. Đâu KHÔNG PHẢI là một biện pháp hardening (bảo mật hệ thống) được yêu cầu?",
        options: [
            "Chạy container bằng user root (Root container)",
            "Network isolation (Cách ly mạng)",
            "Sử dụng mật khẩu mạnh cho DB",
            "Thêm Security headers cho Nginx"
        ],
        correct: 0
    }
];

let index = 0;
let score = 0;

// Am thanh co ban bang Web Audio API
function playSound(isCorrect) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.frequency.value = isCorrect ? 600 : 200;
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
    } catch (e) {}
}

// Chuyen man hinh
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

// Bat dau quiz
function startQuiz() {
    index = 0;
    score = 0;
    showScreen('quizScreen');
    showQuestion();
}

// Hien thi cau hoi
function showQuestion() {
    const q = questions[index];
    document.getElementById('questionText').innerText = q.question;
    document.getElementById('progressBar').style.width = `${(index / questions.length) * 100}%`;

    const box = document.getElementById('optionsBox');
    box.innerHTML = '';

    q.options.forEach((opt, i) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.innerText = opt;
        div.onclick = () => checkAnswer(i, div);
        box.appendChild(div);
    });
}

// Kiem tra dap an
function checkAnswer(selected, element) {
    const options = document.querySelectorAll('.option');
    options.forEach(btn => btn.style.pointerEvents = 'none');

    const isCorrect = selected === questions[index].correct;
    playSound(isCorrect);

    if (isCorrect) {
        element.classList.add('correct');
        score++;
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    } else {
        element.classList.add('wrong');
        options[questions[index].correct].classList.add('correct');
    }

    setTimeout(() => {
        index++;
        if (index < questions.length) {
            showQuestion();
        } else {
            showResult();
        }
    }, 1000);
}

// Hien thi ket qua
function showResult() {
    showScreen('resultScreen');
    document.getElementById('scoreText').innerText = `${score}/${questions.length}`;
    
    const feedback = document.getElementById('feedbackText');
    if (score === questions.length) {
        feedback.innerText = "Wibu Chúa Tể System! Quá đỉnh! 🚀";
        confetti({ particleCount: 150, spread: 100 });
    } else if (score >= 4) {
        feedback.innerText = "Chuẩn bài Anime IT rồi đấy! 👍";
        confetti({ particleCount: 100, spread: 80 });
    } else {
        feedback.innerText = "Chắc mải xem Anime quên ôn bài rồi! Thử lại nha! 😅";
    }
}

// Choi lai tu dau
function restart() {
    startQuiz();
}
