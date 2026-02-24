## Project Structure

```
archr/
├── app/
│   ├── page.tsx                  # Landing page (public)
│   ├── (auth)/
│   │   └── login/page.tsx
│   ├── (dashboard)/
│   │   ├── page.tsx              # Main dashboard
│   │   ├── calendar/page.tsx     # Calendar view
│   │   ├── courses/page.tsx      # Course management
│   │   └── upload/page.tsx       # PDF upload
│   ├── api/
│   │   ├── waitlist/route.ts     # Email signup endpoint
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── pdf/parse/route.ts
│   │   ├── calendar/
│   │   │   ├── sync/route.ts
│   │   │   └── webhook/route.ts
│   │   └── ai/
│   │       ├── schedule/route.ts
│   │       └── optimize/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn components
│   ├── landing/                  # Landing page components
│   │   ├── hero.tsx
│   │   ├── features.tsx
│   │   ├── how-it-works.tsx
│   │   └── waitlist-form.tsx
│   ├── calendar/
│   ├── upload/
│   └── dashboard/
├── lib/
│   ├── ai/
│   │   ├── provider.ts           # AI abstraction layer
│   │   ├── openai.ts
│   │   └── anthropic.ts
│   ├── calendar/
│   │   └── google.ts             # Google Calendar API wrapper
│   ├── pdf/
│   │   └── parser.ts             # PDF parsing logic
│   └── scheduler/
│       └── optimizer.ts          # Scheduling algorithm
├── prisma/
│   └── schema.prisma
└── package.json
```

---

