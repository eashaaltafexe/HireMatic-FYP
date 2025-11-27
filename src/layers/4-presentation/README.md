# Layer 4: Client Presentation Layer

This layer contains all user-facing interfaces built with Next.js.

## 📁 Structure

```
4-presentation/
├── admin/          # Admin dashboard pages
├── candidate/      # Candidate portal pages
├── hr/            # HR dashboard pages
└── components/    # Shared UI components
```

## 🎨 UI Modules

### Admin UI
- User management
- System settings
- Analytics and reports
- Role management

### Candidate Portal UI
- Resume upload
- Job browsing
- Application tracking
- Interview scheduling
- Evaluation results

### HR Dashboard UI
- Job posting management
- Candidate review
- Interview scheduling
- Decision support
- Report generation

### Interview Bot UI
- Live interview interface
- Question display
- Answer recording
- Real-time feedback

### Evaluation System UI
- Candidate scores
- Interview summaries
- Comparison tools
- Feedback reports

## 🔄 Integration

All UI components communicate with Layer 3 (Application Layer) via HTTP/REST APIs.

```typescript
// Example: Fetching data from API
const response = await fetch('/api/candidates');
const data = await response.json();
```

## 📝 Note

The actual UI pages are located in `src/app/` directory following Next.js App Router structure.
This layer serves as the logical organization and reference point for all presentation components.
