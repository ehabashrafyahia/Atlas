// ============================================
// ATLAS PLATFORM 2.0
// Student Chat Widget (أيقونة الشات عند الطالب)
// ============================================
// الاستخدام: أضف السطر التالي قبل </body> في أي صفحة طالب:
//   <script type="module" src="./student-chat.js"></script>
//
// هيكل البيانات في Firestore:
//   chats/{studentUid}                  -> ملخص المحادثة
//   chats/{studentUid}/messages/{id}    -> الرسائل
// ============================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc,
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    writeBatch,
    serverTimestamp,
    increment
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";


const MAX_LEN = 1000;
const MESSAGES_LIMIT = 30;

let mounted = false;

onAuthStateChanged(auth, async user => {

    if (!user || mounted) return;

    try {

        const snap = await getDoc(doc(db, "users", user.uid));

        if (!snap.exists() || snap.data().role !== "student") return;

        mounted = true;

        mountChat(user, snap.data());

    } catch (e) {
        console.error("Chat init failed:", e);
    }

});


function mountChat(user, student) {

    const uid = user.uid;
    const chatRef = doc(db, "chats", uid);
    const msgsCol = collection(db, "chats", uid, "messages");

    /* ---------- CSS ---------- */

    const style = document.createElement("style");

    style.textContent = `
    #scFab{
        position:fixed;
        left:18px;
        bottom:calc(18px + env(safe-area-inset-bottom,0px));
        width:58px;height:58px;
        border:0;border-radius:20px;
        background:linear-gradient(135deg,#10b981,#047857);
        color:#fff;font-size:22px;cursor:pointer;
        box-shadow:0 14px 32px rgba(5,150,105,.38);
        z-index:9000;transition:.2s;
        display:flex;align-items:center;justify-content:center;
    }
    #scFab:hover{transform:translateY(-3px)}
    #scFab:active{transform:scale(.94)}
    #scBadge{
        position:absolute;top:-6px;right:-6px;
        min-width:22px;height:22px;padding:0 6px;
        border-radius:11px;background:#ef4444;color:#fff;
        font:800 11px/22px 'Cairo',sans-serif;text-align:center;
        border:2px solid #fff;display:none;
    }
    #scFab.has-unread{animation:scPulse 1.6s infinite}
    @keyframes scPulse{
        0%,100%{box-shadow:0 14px 32px rgba(5,150,105,.38),0 0 0 0 rgba(16,185,129,.5)}
        50%{box-shadow:0 14px 32px rgba(5,150,105,.38),0 0 0 12px rgba(16,185,129,0)}
    }

    #scPanel{
        position:fixed;left:18px;
        bottom:calc(88px + env(safe-area-inset-bottom,0px));
        width:370px;max-width:calc(100vw - 24px);
        height:520px;max-height:calc(100dvh - 120px);
        background:#fff;border-radius:26px;
        box-shadow:0 30px 80px rgba(15,23,42,.28);
        border:1px solid #e8edf2;
        display:none;flex-direction:column;overflow:hidden;
        z-index:9001;font-family:'Cairo',sans-serif;direction:rtl;
    }
    #scPanel.open{display:flex;animation:scIn .22s ease-out}
    @keyframes scIn{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:none}}

    .sc-head{
        display:flex;align-items:center;gap:11px;padding:14px 16px;color:#fff;
        background:linear-gradient(135deg,#10b981,#047857);
    }
    .sc-avatar{
        width:42px;height:42px;border-radius:14px;background:rgba(255,255,255,.2);
        display:flex;align-items:center;justify-content:center;font-size:18px;
    }
    .sc-head-info{flex:1;min-width:0}
    .sc-head-info strong{display:block;font-size:14px;font-weight:900}
    .sc-head-info span{display:block;font-size:10px;font-weight:700;opacity:.85;margin-top:1px}
    .sc-close{
        width:34px;height:34px;border:0;border-radius:11px;cursor:pointer;
        background:rgba(255,255,255,.18);color:#fff;font-size:14px;
    }

    #scMsgs{
        flex:1;overflow-y:auto;padding:14px;background:#f5f7fa;
        display:flex;flex-direction:column;gap:6px;
        overscroll-behavior:contain;
    }
    .sc-empty{
        margin:auto;text-align:center;color:#94a3b8;font-size:12px;font-weight:700;
        line-height:1.9;padding:20px;
    }
    .sc-empty i{display:block;font-size:34px;color:#a7f3d0;margin-bottom:10px}
    .sc-day{
        align-self:center;margin:8px 0 4px;padding:3px 12px;border-radius:20px;
        background:#e2e8f0;color:#64748b;font-size:10px;font-weight:800;
    }
    .sc-msg{
        max-width:80%;padding:9px 13px;border-radius:18px;
        font-size:13px;font-weight:600;line-height:1.7;
        white-space:pre-wrap;word-break:break-word;
    }
    .sc-msg small{display:block;margin-top:3px;font-size:9px;font-weight:700;opacity:.65}
    .sc-msg.me{
        align-self:flex-start;background:linear-gradient(135deg,#10b981,#059669);
        color:#fff;border-bottom-right-radius:5px;
    }
    .sc-msg.them{
        align-self:flex-end;background:#fff;color:#172033;
        border:1px solid #e8edf2;border-bottom-left-radius:5px;
    }

    .sc-form{
        display:flex;align-items:flex-end;gap:8px;padding:10px 12px;
        background:#fff;border-top:1px solid #e8edf2;
    }
    #scInput{
        flex:1;resize:none;max-height:100px;min-height:42px;
        border:1.5px solid #e2e8f0;border-radius:15px;padding:10px 13px;
        font:600 16px/1.5 'Cairo',sans-serif;color:#172033;outline:none;background:#f8fafc;
        transition:.15s;
    }
    #scInput:focus{border-color:#10b981;background:#fff}
    #scSend{
        width:44px;height:44px;border:0;border-radius:15px;cursor:pointer;flex-shrink:0;
        background:linear-gradient(135deg,#10b981,#047857);color:#fff;font-size:15px;
    }
    #scSend:disabled{opacity:.5;cursor:not-allowed}

    @media (max-width:520px){
        #scPanel{
            left:8px;right:8px;width:auto;max-width:none;
            bottom:calc(84px + env(safe-area-inset-bottom,0px));
            height:calc(100dvh - 110px);max-height:560px;
        }
    }
    `;

    document.head.appendChild(style);


    /* ---------- HTML ---------- */

    const wrap = document.createElement("div");

    wrap.innerHTML = `
    <button id="scFab" type="button" aria-label="مراسلة المدرس">
        <i class="fas fa-comments"></i>
        <span id="scBadge">0</span>
    </button>

    <div id="scPanel" role="dialog" aria-label="الشات مع المدرس">
        <div class="sc-head">
            <div class="sc-avatar"><i class="fas fa-user-tie"></i></div>
            <div class="sc-head-info">
                <strong>تواصل مع المدرس</strong>
                <span>أ. إيهاب أشرف</span>
            </div>
            <button class="sc-close" type="button" id="scClose" aria-label="إغلاق">
                <i class="fas fa-xmark"></i>
            </button>
        </div>

        <div id="scMsgs"></div>

        <div class="sc-form">
            <textarea id="scInput" rows="1" maxlength="${MAX_LEN}"
                      placeholder="اكتب رسالتك هنا..."></textarea>
            <button id="scSend" type="button" aria-label="إرسال">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    </div>
    `;

    document.body.appendChild(wrap);

    const fab = document.getElementById("scFab");
    const badge = document.getElementById("scBadge");
    const panel = document.getElementById("scPanel");
    const msgsEl = document.getElementById("scMsgs");
    const input = document.getElementById("scInput");
    const sendBtn = document.getElementById("scSend");

    let isOpen = false;
    let unread = 0;
    let sending = false;


    /* ---------- Helpers ---------- */

    const fmtTime = d =>
        d.toLocaleTimeString("ar-EG", { hour: "numeric", minute: "2-digit" });

    const fmtDay = d => {

        const today = new Date();
        const yest = new Date(Date.now() - 86400000);

        if (d.toDateString() === today.toDateString()) return "اليوم";
        if (d.toDateString() === yest.toDateString()) return "أمس";

        return d.toLocaleDateString("ar-EG", {
            day: "numeric", month: "long", year: "numeric"
        });

    };

    function renderBadge() {

        if (unread > 0 && !isOpen) {
            badge.style.display = "block";
            badge.textContent = unread > 9 ? "9+" : unread;
            fab.classList.add("has-unread");
        } else {
            badge.style.display = "none";
            fab.classList.remove("has-unread");
        }

    }

    async function markRead() {

        if (unread <= 0) return;

        try {
            await updateDoc(chatRef, { unreadForStudent: 0 });
        } catch (e) { /* المحادثة لسه متعملتش */ }

    }

    function toggle(open) {

        isOpen = open;

        panel.classList.toggle("open", open);

        renderBadge();

        if (open) {
            scrollDown();
            markRead();
            setTimeout(() => input.focus(), 150);
        }

    }

    function scrollDown() {
        msgsEl.scrollTop = msgsEl.scrollHeight;
    }


    /* ---------- Realtime: summary (unread count) ---------- */

    onSnapshot(chatRef, snap => {

        unread = snap.exists() ? (snap.data().unreadForStudent || 0) : 0;

        renderBadge();

        if (isOpen && unread > 0) markRead();

    }, err => console.error("chat summary:", err));


    /* ---------- Realtime: messages ---------- */

    const q = query(msgsCol, orderBy("createdAt", "desc"), limit(MESSAGES_LIMIT));

    onSnapshot(q, snap => {

        const list = snap.docs
            .map(d => d.data({ serverTimestamps: "estimate" }))
            .reverse();

        msgsEl.innerHTML = "";

        if (!list.length) {

            msgsEl.innerHTML = `
                <div class="sc-empty">
                    <i class="fas fa-comment-dots"></i>
                    اكتب سؤالك أو استفسارك<br>وهيوصل للمدرس مباشرة
                </div>`;

            return;
        }

        let lastDay = "";

        list.forEach(m => {

            const date = m.createdAt && m.createdAt.toDate
                ? m.createdAt.toDate() : new Date();

            const day = date.toDateString();

            if (day !== lastDay) {

                lastDay = day;

                const dayEl = document.createElement("div");
                dayEl.className = "sc-day";
                dayEl.textContent = fmtDay(date);
                msgsEl.appendChild(dayEl);

            }

            const el = document.createElement("div");
            el.className = "sc-msg " + (m.sender === "student" ? "me" : "them");

            const text = document.createElement("span");
            text.textContent = m.text || "";

            const time = document.createElement("small");
            time.textContent = fmtTime(date);

            el.appendChild(text);
            el.appendChild(time);

            msgsEl.appendChild(el);

        });

        scrollDown();

    }, err => console.error("chat messages:", err));


    /* ---------- Send ---------- */

    async function send() {

        const text = input.value.trim();

        if (!text || sending) return;

        sending = true;
        sendBtn.disabled = true;

        try {

            const batch = writeBatch(db);

            batch.set(doc(msgsCol), {
                text: text.slice(0, MAX_LEN),
                sender: "student",
                createdAt: serverTimestamp()
            });

            batch.set(chatRef, {
                uid,
                studentName: student.name || "طالب",
                grade: student.grade || "",
                lastMessage: text.slice(0, 80),
                lastMessageAt: serverTimestamp(),
                lastSender: "student",
                unreadForAdmin: increment(1)
            }, { merge: true });

            await batch.commit();

            input.value = "";
            input.style.height = "auto";

        } catch (e) {

            console.error("send failed:", e);

            if (window.Swal) {
                Swal.fire({
                    icon: "error",
                    title: "تعذر الإرسال",
                    text: "تأكد من اتصالك بالإنترنت وحاول مرة أخرى.",
                    confirmButtonColor: "#059669"
                });
            } else {
                alert("تعذر إرسال الرسالة، حاول مرة أخرى.");
            }

        } finally {

            sending = false;
            sendBtn.disabled = false;
            input.focus();

        }

    }


    /* ---------- Events ---------- */

    fab.addEventListener("click", () => toggle(!isOpen));
    document.getElementById("scClose").addEventListener("click", () => toggle(false));
    sendBtn.addEventListener("click", send);

    input.addEventListener("input", () => {
        input.style.height = "auto";
        input.style.height = Math.min(input.scrollHeight, 100) + "px";
    });

    input.addEventListener("keydown", e => {
        // Enter للإرسال على الكمبيوتر، Shift+Enter سطر جديد
        if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 640) {
            e.preventDefault();
            send();
        }
    });

}
