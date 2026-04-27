# 📊 מנתח תזרים מזומנים רב-מטבעי

אפליקציית ווב לניהול וניתוח תזרים מזומנים עסקי במטבעות GBP, ILS ו-USD, עם ניתוח AI מבוסס Claude.

---

## ✅ דרישות מקדימות

- **Node.js 18+** — [הורד כאן](https://nodejs.org)
- **מפתח API של Anthropic** — [קבל כאן](https://console.anthropic.com)

---

## 🚀 התקנה והפעלה

### 1. שכפל/פתח את הפרויקט

```bash
cd cashflow-analyzer
```

### 2. התקן תלויות

```bash
npm install
```

### 3. הגדר משתני סביבה

צור קובץ `.env.local` בתיקיית הפרויקט:

```bash
cp .env.local.example .env.local
```

ערוך את הקובץ והכנס את מפתח ה-API שלך:

```
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 4. הגדר את מסד הנתונים

```bash
npm run setup
```

פקודה זו:
- יוצרת את מסד הנתונים SQLite (`prisma/dev.db`)
- מכניסה נתוני דוגמה לשלושת החשבונות

### 5. הפעל את האפליקציה

```bash
npm run dev
```

פתח דפדפן בכתובת: **http://localhost:3000**

---

## 📋 פקודות נוספות

| פקודה | תיאור |
|-------|-------|
| `npm run dev` | הפעל בסביבת פיתוח |
| `npm run build` | בנה לפרודקשן |
| `npm run setup` | צור DB וזרע נתוני דוגמה |
| `npm run db:push` | עדכן סכמת DB |
| `npm run db:seed` | זרע נתוני דוגמה מחדש |
| `npm run db:studio` | פתח Prisma Studio לניהול DB |

---

## 🗂️ מבנה הפרויקט

```
cashflow-analyzer/
├── prisma/
│   ├── schema.prisma     # הגדרת מסד הנתונים
│   ├── seed.ts           # נתוני דוגמה
│   └── dev.db            # SQLite (נוצר אוטומטית)
├── src/
│   ├── app/
│   │   ├── api/          # API Routes
│   │   │   ├── accounts/
│   │   │   ├── transactions/
│   │   │   ├── classify/     # סיווג AI
│   │   │   ├── analyze/      # ניתוח AI (streaming)
│   │   │   └── exchange-rates/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/       # קומפוננטות React
│   ├── lib/              # כלי עזר + Prisma
│   └── types/            # TypeScript types
├── .env.local            # משתני סביבה (צור בעצמך)
└── .env.local.example    # דוגמה למשתני סביבה
```

---

## 💡 תכונות עיקריות

### חשבונות מטבע
- **GBP** — חשבון פאונד בריטי
- **ILS** — חשבון שקל ישראלי
- **USD** — חשבון דולר אמריקאי

### ניהול עסקאות
- **העלאת CSV** — העלה קובץ בנק בפורמט: `תאריך, תיאור, סכום`
- **הדבק נתונים** — הדבק ישירות מהבנק
- **עריכה שורה-שורה** — ערוך תאריך, תיאור, סכום וקטגוריה
- **מחיקה** — מחק עסקאות בודדות

### סיווג קטגוריות
11 קטגוריות: שכר ועובדים, שכירות ומשרד, שיווק ופרסום, ספקים וחומרים, תשתיות ותוכנה, הכנסות ממכירות, הכנסות משירותים, הלוואות ומימון, מסים ורגולציה, הוצאות כלליות, אחר.

- **סיווג אוטומטי** — לחץ ✨ לסיווג אוטומטי עם Claude AI

### ניתוח AI (Streaming)
- **ניתוח מלא** — מגמות, תובנות, ביצועים
- **המלצות חיסכון** — הזדמנויות להפחתת עלויות
- **זיהוי סיכונים** — סיכוני נזילות, תלות, אזהרות

### תצוגה מאוחדת
- המרת כל המטבעות ל-ILS עם שערי חליפין ניתנים לעריכה
- גרף השוואה בין מטבעות
- ניתוח AI כולל עם דגש על חשיפת FX

### ייצוא
- **CSV** — ייצא עסקאות לאקסל
- **PDF** — ייצא דוח מלא עם גרפים

---

## 📁 פורמט קובץ CSV

```
01/01/2026,Client payment,8500
05/01/2026,Office rent,-2100
10/01/2026,"Staff salaries, monthly",-6500
```

**פורמטי תאריך נתמכים:**
- `DD/MM/YYYY` (מומלץ)
- `MM/DD/YYYY`
- `YYYY-MM-DD`

**סכומים:**
- חיובי = הכנסה
- שלילי = הוצאה

---

## 🔧 פתרון בעיות

**שגיאה: "Cannot find module @prisma/client"**
```bash
npm run db:push
```

**שגיאה: "ANTHROPIC_API_KEY is not set"**
בדוק שיצרת קובץ `.env.local` עם המפתח הנכון.

**מסד הנתונים ריק**
```bash
npm run db:seed
```

---

## 🛠️ טכנולוגיות

- **Next.js 14** — App Router + API Routes
- **TypeScript** — טיפוסים סטטיים
- **Tailwind CSS** — עיצוב
- **Prisma + SQLite** — מסד נתונים מקומי
- **Anthropic SDK** — Claude AI
- **Recharts** — גרפים
- **jsPDF + html2canvas** — ייצוא PDF
