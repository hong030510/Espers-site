import { db, auth, provider, ADMIN_EMAIL } from "./firebase-config.js";
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    limit
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

import {
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

/* 모바일 메뉴 */
const menuToggle = document.getElementById("menuToggle");
const menu = document.querySelector(".menu");

if (menuToggle && menu) {
    menuToggle.addEventListener("click", () => {
        menu.classList.toggle("show");
    });
}

/* 메인 자동 슬라이드 */
const autoSlideImage = document.getElementById("autoSlideImage");

const imageList = Array.from(
    { length: 10 },
    (_, i) => `assets/동아리 대표 사진/${i + 1}.jpg`
);

let currentImageIndex = 0;

if (autoSlideImage) {
    setInterval(() => {
        autoSlideImage.classList.add("fade-out");

        setTimeout(() => {
            currentImageIndex = (currentImageIndex + 1) % imageList.length;
            autoSlideImage.src = imageList[currentImageIndex];
            autoSlideImage.classList.remove("fade-out");
        }, 600);
    }, 3000);
}

/* 이미지 확대 */
const zoomableImages = document.querySelectorAll(".zoomable");
const imageModal = document.getElementById("imageModal");
const imageModalImg = document.getElementById("imageModalImg");
const imageModalClose = document.getElementById("imageModalClose");
const imageModalPrev = document.getElementById("imageModalPrev");
const imageModalNext = document.getElementById("imageModalNext");

let currentGalleryIndex = 0;
let currentGalleryList = [];

function openGalleryModal(index, list) {
    if (!imageModal || !imageModalImg || !list.length) return;

    currentGalleryList = list;
    currentGalleryIndex = index;

    imageModal.classList.add("show");
    imageModal.classList.add("gallery-large");
    imageModalImg.src = currentGalleryList[currentGalleryIndex].image;
    imageModalImg.alt = currentGalleryList[currentGalleryIndex].title;
    document.body.style.overflow = "hidden";
}

function moveGallery(step) {
    if (!currentGalleryList.length || !imageModalImg) return;

    currentGalleryIndex =
        (currentGalleryIndex + step + currentGalleryList.length) % currentGalleryList.length;

    imageModalImg.src = currentGalleryList[currentGalleryIndex].image;
    imageModalImg.alt = currentGalleryList[currentGalleryIndex].title;
}

function closeImageModal() {
    if (!imageModal) return;

    imageModal.classList.remove("show");
    imageModal.classList.remove("gallery-large");
    document.body.style.overflow = "";
}

zoomableImages.forEach((img) => {
    img.addEventListener("click", () => {
        if (!imageModal || !imageModalImg) return;
        imageModal.classList.add("show");
        imageModalImg.src = img.src;
        imageModalImg.alt = img.alt;
        document.body.style.overflow = "hidden";
    });
});

if (imageModalClose) {
    imageModalClose.addEventListener("click", closeImageModal);
}

if (imageModal) {
    imageModal.addEventListener("click", (e) => {
        if (e.target === imageModal) {
            closeImageModal();
        }
    });
}

if (imageModalPrev) {
    imageModalPrev.addEventListener("click", (e) => {
        e.stopPropagation();
        moveGallery(-1);
    });
}

if (imageModalNext) {
    imageModalNext.addEventListener("click", (e) => {
        e.stopPropagation();
        moveGallery(1);
    });
}

/* 날짜 포맷 */
function formatDate(timestamp) {
    if (!timestamp || !timestamp.toDate) return "날짜 없음";

    const date = timestamp.toDate();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}.${month}.${day}`;
}

/* 일정 캘린더 */
const calendarGrid = document.getElementById("calendarGrid");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const calendarScheduleList = document.getElementById("calendarScheduleList");
const calendarPrevBtn = document.getElementById("calendarPrevBtn");
const calendarNextBtn = document.getElementById("calendarNextBtn");

let calendarCurrentDate = new Date();
let allSchedules = [];

function formatScheduleDate(dateString) {
    const [year, month, day] = dateString.split("-");
    return `${year}.${month}.${day}`;
}

function sameDate(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function renderCalendar() {
    if (!calendarGrid || !calendarMonthLabel || !calendarScheduleList) return;

    const year = calendarCurrentDate.getFullYear();
    const month = calendarCurrentDate.getMonth();

    calendarMonthLabel.textContent = `${year}.${String(month + 1).padStart(2, "0")}`;

    calendarGrid.innerHTML = "";
    calendarScheduleList.innerHTML = "";

    const firstDay = new Date(year, month, 1);
    const firstWeekday = firstDay.getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    const today = new Date();

    const currentMonthSchedules = allSchedules
        .filter((item) => {
            const itemDate = new Date(item.date);
            return (
                itemDate.getFullYear() === year &&
                itemDate.getMonth() === month
            );
        })
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    for (let i = 0; i < firstWeekday; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day empty";
        calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= lastDate; day++) {
        const cellDate = new Date(year, month, day);

        const daySchedules = currentMonthSchedules.filter((item) => {
            const itemDate = new Date(item.date);
            return sameDate(itemDate, cellDate);
        });

        const cell = document.createElement("div");
        cell.className = "calendar-day";

        if (sameDate(cellDate, today)) {
            cell.classList.add("today");
        }

        if (daySchedules.length > 0) {
            cell.classList.add("has-event");
        }

        cell.innerHTML = `
            <div class="calendar-day-number">${day}</div>
        `;

        calendarGrid.appendChild(cell);
    }

    if (currentMonthSchedules.length === 0) {
        calendarScheduleList.innerHTML = `
            <div class="calendar-empty">이번 달 일정이 없습니다.</div>
        `;
        return;
    }

    currentMonthSchedules.forEach((item) => {
        const scheduleItem = document.createElement("div");
        scheduleItem.className = "calendar-schedule-item";
        scheduleItem.innerHTML = `
            <div class="calendar-schedule-date">${formatScheduleDate(item.date)}</div>
            <div class="calendar-schedule-title">${item.title || ""}</div>
            ${item.location ? `<div class="calendar-schedule-location">${item.location}</div>` : ""}
        `;
        calendarScheduleList.appendChild(scheduleItem);
    });
}

if (calendarPrevBtn) {
    calendarPrevBtn.addEventListener("click", () => {
        calendarCurrentDate = new Date(
            calendarCurrentDate.getFullYear(),
            calendarCurrentDate.getMonth() - 1,
            1
        );
        renderCalendar();
    });
}

if (calendarNextBtn) {
    calendarNextBtn.addEventListener("click", () => {
        calendarCurrentDate = new Date(
            calendarCurrentDate.getFullYear(),
            calendarCurrentDate.getMonth() + 1,
            1
        );
        renderCalendar();
    });
}

if (calendarGrid) {
    const schedulesRef = collection(db, "schedules");
    const q = query(schedulesRef, orderBy("date", "asc"));

    onSnapshot(
        q,
        (snapshot) => {
            allSchedules = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));

            renderCalendar();
        },
        (error) => {
            console.error("일정 불러오기 실패:", error);

            if (calendarScheduleList) {
                calendarScheduleList.innerHTML = `
                    <div class="calendar-empty">일정을 불러오지 못했습니다.</div>
                `;
            }
        }
    );
}

/* 관리자 판별 */
function isAdmin(user) {
    return !!user && user.email === ADMIN_EMAIL;
}

/* 공지사항 - 홈 최근 3개 */
const homeNoticeList = document.getElementById("homeNoticeList");

if (homeNoticeList) {
    const noticesRef = collection(db, "notices");
    const q = query(noticesRef, orderBy("createdAt", "desc"), limit(3));

    onSnapshot(
        q,
        (snapshot) => {
            homeNoticeList.innerHTML = "";

            if (snapshot.empty) {
                homeNoticeList.innerHTML = `
                    <div class="home-notice-empty">등록된 공지사항이 없습니다.</div>
                `;
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();

                const item = document.createElement("a");
                item.href = "notice.html";
                item.className = "home-notice-item";
                item.innerHTML = `
                    <div class="home-notice-title">${data.title || ""}</div>
                    <div class="home-notice-date">${formatDate(data.createdAt)}</div>
                `;

                homeNoticeList.appendChild(item);
            });
        },
        (error) => {
            console.error("홈 공지사항 불러오기 실패:", error);
            homeNoticeList.innerHTML = `
                <div class="home-notice-empty">공지사항을 불러오지 못했습니다.</div>
            `;
        }
    );
}

/* 공지사항 관리자 */
const adminStatusText = document.getElementById("adminStatusText");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");
const noticeWriteBox = document.getElementById("noticeWriteBox");
const noticeTitleInput = document.getElementById("noticeTitleInput");
const noticeContentInput = document.getElementById("noticeContentInput");
const noticeSubmitBtn = document.getElementById("noticeSubmitBtn");

if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("관리자 로그인 실패:", error);
            alert("로그인 실패: " + error.message);
        }
    });
}

if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("로그아웃 실패:", error);
            alert("로그아웃 실패: " + error.message);
        }
    });
}

onAuthStateChanged(auth, (user) => {
    if (!adminStatusText || !adminLoginBtn || !adminLogoutBtn || !noticeWriteBox) return;

    if (isAdmin(user)) {
        adminStatusText.textContent = `${user.email} 관리자 로그인 상태입니다.`;
        adminLoginBtn.style.display = "none";
        adminLogoutBtn.style.display = "inline-block";
        noticeWriteBox.style.display = "grid";
    } else if (user) {
        adminStatusText.textContent = "관리자 계정이 아닙니다.";
        adminLoginBtn.style.display = "none";
        adminLogoutBtn.style.display = "inline-block";
        noticeWriteBox.style.display = "none";
    } else {
        adminStatusText.textContent = "관리자 로그인이 필요합니다.";
        adminLoginBtn.style.display = "inline-block";
        adminLogoutBtn.style.display = "none";
        noticeWriteBox.style.display = "none";
    }
});

if (noticeSubmitBtn) {
    noticeSubmitBtn.addEventListener("click", async () => {
        const user = auth.currentUser;

        if (!isAdmin(user)) {
            alert("관리자만 공지를 등록할 수 있습니다.");
            return;
        }

        const title = noticeTitleInput.value.trim();
        const content = noticeContentInput.value.trim();

        if (!title || !content) {
            alert("공지 제목과 내용을 입력하세요.");
            return;
        }

        try {
            await addDoc(collection(db, "notices"), {
                title,
                content,
                createdAt: serverTimestamp()
            });

            noticeTitleInput.value = "";
            noticeContentInput.value = "";
            closeNoticeWriteModal();
            alert("공지사항이 등록되었습니다.");
        } catch (error) {
            console.error("공지 등록 실패:", error);
            alert("공지 등록 실패: " + error.message);
        }
    });
}

/* 공지사항 모달 */
const noticeBoard = document.getElementById("noticeBoard");
const noticeModal = document.getElementById("noticeModal");
const noticeModalTitle = document.getElementById("noticeModalTitle");
const noticeModalDate = document.getElementById("noticeModalDate");
const noticeModalContent = document.getElementById("noticeModalContent");
const noticeModalClose = document.getElementById("noticeModalClose");

function openNoticeModal(title, date, content) {
    if (!noticeModal || !noticeModalTitle || !noticeModalDate || !noticeModalContent) return;

    noticeModalTitle.textContent = title || "";
    noticeModalDate.textContent = date || "";
    noticeModalContent.textContent = content || "";
    noticeModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeNoticeModal() {
    if (!noticeModal) return;
    noticeModal.classList.remove("show");
    document.body.style.overflow = "";
}

if (noticeModalClose) {
    noticeModalClose.addEventListener("click", closeNoticeModal);
}

if (noticeModal) {
    noticeModal.addEventListener("click", (e) => {
        if (e.target === noticeModal) {
            closeNoticeModal();
        }
    });
}

/* 공지사항 - 게시판 전체 */
if (noticeBoard) {
    const noticesRef = collection(db, "notices");
    const q = query(noticesRef, orderBy("createdAt", "desc"));

    onSnapshot(
        q,
        (snapshot) => {
            noticeBoard.innerHTML = "";

            if (snapshot.empty) {
                noticeBoard.innerHTML = `
                    <div class="notice-empty">등록된 공지사항이 없습니다.</div>
                `;
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();
                const noticeDate = formatDate(data.createdAt);

                const item = document.createElement("div");
                item.className = "notice-row";
                item.innerHTML = `
                    <div class="notice-row-title">${data.title || ""}</div>
                    <div class="notice-row-date">${noticeDate}</div>
                `;

                item.addEventListener("click", () => {
                    openNoticeModal(
                        data.title || "",
                        noticeDate,
                        data.content || ""
                    );
                });

                noticeBoard.appendChild(item);
            });
        },
        (error) => {
            console.error("공지사항 불러오기 실패:", error);
            noticeBoard.innerHTML = `
                <div class="notice-empty">공지사항을 불러오지 못했습니다.</div>
            `;
        }
    );
}

/* 수상경력 */
/* 수상경력 */
const awardOpenBtn = document.getElementById("awardOpenBtn");
const awardModal = document.getElementById("awardModal");
const awardModalClose = document.getElementById("awardModalClose");

const awardTitle = document.getElementById("awardTitle");
const awardDesc = document.getElementById("awardDesc");
const addAwardBtn = document.getElementById("addAwardBtn");
const awardList = document.getElementById("awardList");
const awardScrollBox = document.getElementById("awardScrollBox");

const awardsRef = collection(db, "awards");

function openAwardModal() {
    if (!awardModal) return;
    awardModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeAwardModal() {
    if (!awardModal) return;
    awardModal.classList.remove("show");
    document.body.style.overflow = "";
}

if (awardOpenBtn) {
    awardOpenBtn.addEventListener("click", () => {
        if (!isAdmin(auth.currentUser)) {
            alert("관리자만 수상 기록을 등록할 수 있습니다.");
            return;
        }

        openAwardModal();
    });
}

if (awardModalClose) {
    awardModalClose.addEventListener("click", closeAwardModal);
}

if (awardModal) {
    awardModal.addEventListener("click", (e) => {
        if (e.target === awardModal) {
            closeAwardModal();
        }
    });
}

onAuthStateChanged(auth, (user) => {
    if (!awardOpenBtn) return;

    if (isAdmin(user)) {
        awardOpenBtn.style.display = "inline-flex";
    } else {
        awardOpenBtn.style.display = "none";
    }
});

if (addAwardBtn) {
    addAwardBtn.addEventListener("click", async () => {
        const user = auth.currentUser;

        if (!isAdmin(user)) {
            alert("관리자만 수상 기록을 등록할 수 있습니다.");
            return;
        }

        try {
            const title = awardTitle.value.trim();
            const desc = awardDesc.value.trim();

            if (!title || !desc) {
                alert("수상명과 설명을 입력하세요.");
                return;
            }

            await addDoc(awardsRef, {
                title,
                desc,
                createdAt: serverTimestamp()
            });

            awardTitle.value = "";
            awardDesc.value = "";

            if (awardScrollBox) {
                awardScrollBox.scrollTop = 0;
            }

            closeAwardModal();
            alert("수상 기록이 등록되었습니다.");
        } catch (error) {
            console.error("추가 실패:", error);
            alert("추가 실패: " + error.message);
        }
    });
}

if (awardList) {
    const q = query(awardsRef, orderBy("createdAt", "desc"));

    onSnapshot(
        q,
        (snapshot) => {
            awardList.innerHTML = "";

            if (snapshot.empty) {
                awardList.innerHTML = `
                    <div class="notice-empty">등록된 수상 기록이 없습니다.</div>
                `;
                return;
            }

            snapshot.forEach((doc) => {
                const data = doc.data();

                const item = document.createElement("div");
                item.className = "card award-item";
                item.innerHTML = `
                    <h3>${data.title || ""}</h3>
                    <p>${data.desc || ""}</p>
                `;

                awardList.appendChild(item);
            });

            if (awardScrollBox) {
                awardScrollBox.scrollTop = 0;
            }
        },
        (error) => {
            console.error("목록 불러오기 실패:", error);
            alert("목록 불러오기 실패: " + error.message);
        }
    );
}
if (awardList) {
    const q = query(awardsRef, orderBy("createdAt", "desc"));

    onSnapshot(
        q,
        (snapshot) => {
            awardList.innerHTML = "";

            snapshot.forEach((doc) => {
                const data = doc.data();

                const item = document.createElement("div");
                item.className = "card award-item";
                item.innerHTML = `
                    <h3>${data.title || ""}</h3>
                    <p>${data.desc || ""}</p>
                `;

                awardList.appendChild(item);
            });

            if (awardScrollBox) {
                awardScrollBox.scrollTop = 0;
            }
        },
        (error) => {
            console.error("목록 불러오기 실패:", error);
            alert("목록 불러오기 실패: " + error.message);
        }
    );
}

/* 지원 버튼 */
const downloadBtn = document.getElementById("downloadBtn");

if (downloadBtn) {
    downloadBtn.addEventListener("click", (e) => {
        e.preventDefault();
        alert("지금은 지원기간이 아닙니다.");
    });
}

/* QNA 등록 */
const qnaName = document.getElementById("qnaName");
const qnaAnonymous = document.getElementById("qnaAnonymous");
const qnaTitle = document.getElementById("qnaTitle");
const qnaContent = document.getElementById("qnaContent");
const qnaSubmitBtn = document.getElementById("qnaSubmitBtn");

if (qnaAnonymous && qnaName) {
    qnaAnonymous.addEventListener("change", () => {
        if (qnaAnonymous.checked) {
            qnaName.value = "";
            qnaName.disabled = true;
            qnaName.placeholder = "익명으로 작성됩니다";
        } else {
            qnaName.disabled = false;
            qnaName.placeholder = "이름 입력";
        }
    });
}

if (qnaSubmitBtn) {
    qnaSubmitBtn.addEventListener("click", async () => {
        try {
            const isAnonymous = qnaAnonymous && qnaAnonymous.checked;
            const name = isAnonymous ? "익명" : qnaName.value.trim();
            const title = qnaTitle.value.trim();
            const content = qnaContent.value.trim();

            if (!title || !content) {
                alert("제목과 내용을 입력하세요.");
                return;
            }

            if (!isAnonymous && !name) {
                alert("이름을 입력하거나 익명 체크를 해주세요.");
                return;
            }

            await addDoc(collection(db, "qna"), {
                name,
                anonymous: isAnonymous,
                title,
                content,
                answer: "",
                createdAt: serverTimestamp()
            });

            qnaName.value = "";
            qnaAnonymous.checked = false;
            qnaName.disabled = false;
            qnaName.placeholder = "이름 입력";
            qnaTitle.value = "";
            qnaContent.value = "";

            alert("등록되었습니다.");
        } catch (error) {
            console.error("QNA 등록 실패:", error);
            alert("등록 실패: " + error.message);
        }
    });
}

/* QNA 목록 */
const qnaList = document.getElementById("qnaList");
const qnaScrollBox = document.getElementById("qnaScrollBox");

if (qnaList) {
    const qnaRef = collection(db, "qna");
    const q = query(qnaRef, orderBy("createdAt", "desc"));

    onSnapshot(
        q,
        (snapshot) => {
            qnaList.innerHTML = "";

            snapshot.forEach((doc) => {
                const data = doc.data();
                const hasAnswer = data.answer && data.answer.trim();

                const item = document.createElement("div");
                item.className = "qna-item";

                item.innerHTML = `
                    <div class="qna-meta">
                        <span class="qna-author">${data.name || "익명"}</span>
                        <span class="qna-badge">${hasAnswer ? "답변 완료" : "답변 대기"}</span>
                    </div>

                    <div class="qna-question-title">${data.title || ""}</div>
                    <div class="qna-question-content">${data.content || ""}</div>

                    <div class="qna-answer-box">
                        <div class="qna-answer-label">관리자 답변</div>
                        <div class="qna-answer-content">
                            ${hasAnswer
                        ? data.answer
                        : '<span class="qna-waiting">아직 답변이 등록되지 않았습니다.</span>'}
                        </div>
                    </div>
                `;

                qnaList.appendChild(item);
            });

            if (qnaScrollBox) {
                qnaScrollBox.scrollTop = 0;
            }
        },
        (error) => {
            console.error("QNA 목록 불러오기 실패:", error);
            alert("QNA 목록 불러오기 실패: " + error.message);
        }
    );
}

/* gallery theme view */
const galleryThemeList = document.getElementById("galleryThemeList");
const galleryDetailSection = document.getElementById("galleryDetailSection");
const galleryDetailTitle = document.getElementById("galleryDetailTitle");
const galleryBackBtn = document.getElementById("galleryBackBtn");
const graduateGallery = document.getElementById("graduateGallery");

function pad(num) {
    return String(num).padStart(2, "0");
}

function getGraduateImage(num) {
    return `assets/graduate/KakaoTalk_20260306_132944724_${pad(num)}.png`;
}

const galleryThemes = [
    {
        key: "graduates",
        title: "졸업생 모음",
        desc: "선배 인터뷰와 취업 현황을 확인해 보세요.",
        cover: getGraduateImage(27),
        items: [
            27, 28, 29, 30, 31,
            ...Array.from({ length: 26 }, (_, i) => i + 1)
        ].map((num) => {
            const isEmployment = num >= 27 && num <= 31;
            const employmentIndex = num - 26;

            return {
                id: num,
                type: isEmployment ? "employment" : "interview",
                title: isEmployment
                    ? `선배 취업 현황 ${employmentIndex}`
                    : `선배 인터뷰 ${num}`,
                image: getGraduateImage(num)
            };
        })
    }

    // 나중에 이런 식으로 추가하면 됨
    // {
    //     key: "club",
    //     title: "동아리 활동",
    //     desc: "행사와 활동 사진을 모아봤어요.",
    //     cover: "assets/activity/1.jpg",
    //     items: [
    //         { id: 1, title: "동아리 활동 1", image: "assets/activity/1.jpg" },
    //         { id: 2, title: "동아리 활동 2", image: "assets/activity/2.jpg" }
    //     ]
    // }
];

function renderThemeList() {
    if (!galleryThemeList) return;

    galleryThemeList.innerHTML = "";

    galleryThemes.forEach((theme) => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "gallery-theme-card";

        card.innerHTML = `
            <div class="gallery-theme-image-wrap">
                <img src="${theme.cover}" alt="${theme.title}" class="gallery-theme-image" />
            </div>
            <div class="gallery-theme-content">
                <h3>${theme.title}</h3>
                <p>${theme.desc}</p>
            </div>
        `;

        card.addEventListener("click", () => {
            renderThemeDetail(theme);
        });

        galleryThemeList.appendChild(card);
    });
}

function renderThemeDetail(theme) {
    if (!graduateGallery || !galleryDetailSection || !galleryDetailTitle || !galleryThemeList) return;

    galleryThemeList.style.display = "none";
    galleryDetailSection.style.display = "block";
    galleryDetailTitle.textContent = theme.title;
    graduateGallery.innerHTML = "";

    theme.items.forEach((item, index) => {
        const card = document.createElement("div");
        card.className = item.type === "employment"
            ? "gallery-page-card featured"
            : "gallery-page-card";

        card.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="zoomable" />
            <p>${item.title}</p>
        `;

        const img = card.querySelector(".zoomable");
        img.addEventListener("click", () => {
            openGalleryModal(index, theme.items);
        });

        graduateGallery.appendChild(card);
    });

    window.scrollTo({
        top: galleryDetailSection.offsetTop - 40,
        behavior: "smooth"
    });
}

if (galleryBackBtn) {
    galleryBackBtn.addEventListener("click", () => {
        if (!galleryThemeList || !galleryDetailSection || !graduateGallery) return;

        galleryThemeList.style.display = "grid";
        galleryDetailSection.style.display = "none";
        graduateGallery.innerHTML = "";
    });
}

renderThemeList();

/* 공통 키보드 이벤트 */
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeNoticeModal();
        closeImageModal();
    }

    if (!imageModal || !imageModal.classList.contains("show")) return;

    if (e.key === "ArrowLeft") moveGallery(-1);
    if (e.key === "ArrowRight") moveGallery(1);
});

/* 일정 추가 모달 */
const scheduleOpenBtn = document.getElementById("scheduleOpenBtn");
const scheduleModal = document.getElementById("scheduleModal");
const scheduleModalClose = document.getElementById("scheduleModalClose");
const scheduleDateInput = document.getElementById("scheduleDateInput");
const scheduleTitleInput = document.getElementById("scheduleTitleInput");
const scheduleLocationInput = document.getElementById("scheduleLocationInput");
const scheduleDescInput = document.getElementById("scheduleDescInput");
const scheduleSubmitBtn = document.getElementById("scheduleSubmitBtn");

function openScheduleModal() {
    if (!scheduleModal) return;
    scheduleModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeScheduleModal() {
    if (!scheduleModal) return;
    scheduleModal.classList.remove("show");
    document.body.style.overflow = "";
}

if (scheduleOpenBtn) {
    scheduleOpenBtn.addEventListener("click", () => {
        if (!isAdmin(auth.currentUser)) {
            alert("관리자만 일정을 등록할 수 있습니다.");
            return;
        }

        openScheduleModal();
    });
}

if (scheduleModalClose) {
    scheduleModalClose.addEventListener("click", closeScheduleModal);
}

if (scheduleModal) {
    scheduleModal.addEventListener("click", (e) => {
        if (e.target === scheduleModal) {
            closeScheduleModal();
        }
    });
}

onAuthStateChanged(auth, (user) => {
    if (!scheduleOpenBtn) return;

    if (isAdmin(user)) {
        scheduleOpenBtn.style.display = "inline-flex";
    } else {
        scheduleOpenBtn.style.display = "none";
    }
});

if (scheduleSubmitBtn) {
    scheduleSubmitBtn.addEventListener("click", async () => {
        const user = auth.currentUser;

        if (!isAdmin(user)) {
            alert("관리자만 일정을 등록할 수 있습니다.");
            return;
        }

        const date = scheduleDateInput.value;
        const title = scheduleTitleInput.value.trim();
        const location = scheduleLocationInput.value.trim();
        const desc = scheduleDescInput.value.trim();

        if (!date || !title) {
            alert("날짜와 일정 제목을 입력하세요.");
            return;
        }

        try {
            await addDoc(collection(db, "schedules"), {
                date,
                title,
                location,
                desc,
                createdAt: serverTimestamp()
            });

            scheduleDateInput.value = "";
            scheduleTitleInput.value = "";
            scheduleLocationInput.value = "";
            scheduleDescInput.value = "";

            closeScheduleModal();
            alert("일정이 등록되었습니다.");
        } catch (error) {
            console.error("일정 등록 실패:", error);
            alert("일정 등록 실패: " + error.message);
        }
    });
}

/* 공지사항 + 버튼 / 작성 모달 */
const noticeOpenBtn = document.getElementById("noticeOpenBtn");
const noticeWriteModal = document.getElementById("noticeWriteModal");
const noticeWriteModalClose = document.getElementById("noticeWriteModalClose");

function openNoticeWriteModal() {
    if (!noticeWriteModal) return;
    noticeWriteModal.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeNoticeWriteModal() {
    if (!noticeWriteModal) return;
    noticeWriteModal.classList.remove("show");
    document.body.style.overflow = "";
}

if (noticeOpenBtn) {
    noticeOpenBtn.addEventListener("click", async () => {
        try {
            let user = auth.currentUser;

            if (!user) {
                const result = await signInWithPopup(auth, provider);
                user = result.user;
            }

            if (!isAdmin(user)) {
                alert("관리자 계정만 공지를 등록할 수 있습니다.");
                return;
            }

            openNoticeWriteModal();
        } catch (error) {
            console.error("관리자 로그인 실패:", error);
            alert("로그인 실패: " + error.message);
        }
    });
}

if (noticeWriteModalClose) {
    noticeWriteModalClose.addEventListener("click", closeNoticeWriteModal);
}

if (noticeWriteModal) {
    noticeWriteModal.addEventListener("click", (e) => {
        if (e.target === noticeWriteModal) {
            closeNoticeWriteModal();
        }
    });
}