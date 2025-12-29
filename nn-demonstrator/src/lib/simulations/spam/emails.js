// 4 Example Emails
// Features: [SpamWords, Links, CapsLock, Exclamations]

export const emails = [
    {
        id: 1,
        subject: "Meeting Reminder",
        text: "Hi Team, just a reminder about the meeting tomorrow at 10 AM. Please review the agenda attached.",
        features: [0, 0, 0, 0], // Clean
        isSpam: 0,
        highlights: []
    },
    {
        id: 2,
        subject: "WINNER!! PRIZE WAITING!!",
        text: "CONGRATULATIONS! You have WON a $1000 gift card! CLICK HERE to claim your prize NOW!!!",
        features: [2, 1, 5, 3], // Winner, Prize; Link; CONGRATS, WON, NOW, CLICK, HERE; !!!
        isSpam: 1,
        highlights: [
            { text: "WON", type: "spam" },
            { text: "CLICK HERE", type: "link" },
            { text: "NOW!!!", type: "caps" }
        ]
    },
    {
        id: 3,
        subject: "Invoice #1234",
        text: "Dear Customer, please find your invoice attached. If you have questions, contact support.",
        features: [0, 0, 0, 0], // Clean logic, maybe 'invoice' is neutral
        isSpam: 0,
        highlights: []
    },
    {
        id: 4,
        subject: "Cheap Meds Online",
        text: "Buy cheap pills online! Best price guaranteed. Visit our website http://fake-meds.com for discount.",
        features: [3, 1, 0, 0], // Buy, cheap, pills; Link
        isSpam: 1,
        highlights: [
            { text: "cheap pills", type: "spam" },
            { text: "http://fake-meds.com", type: "link" }
        ]
    }
];

// Helper to "scan" text and count features simply (mock logic for the visualizer)
export function scanEmail(text) {
    const spamWords = ['win', 'won', 'prize', 'free', 'money', 'cheap', 'pills', 'buy', 'offer', 'urgent'];
    const lower = text.toLowerCase();

    // 1. Spam Words
    let spamCount = 0;
    spamWords.forEach(w => {
        if (lower.includes(w)) spamCount++;
    });

    // 2. Links (http)
    const linkCount = (text.match(/http/g) || []).length + (text.match(/www/g) || []).length;

    // 3. Caps Lock Words (Words > 2 chars fully uppercase)
    const capsCount = (text.match(/\b[A-Z]{3,}\b/g) || []).length;

    // 4. Exclamations
    const exclamCount = (text.match(/!/g) || []).length;

    return [spamCount, linkCount, capsCount, exclamCount];
}
