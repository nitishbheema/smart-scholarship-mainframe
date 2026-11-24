# Smart Scholarship Mainframe Frontend Console

React 18, Vite, TypeScript, and Tailwind CSS dashboard interface for the **Smart Scholarship Eligibility & Disbursement Processing System**.

Designed according to modern enterprise banking and mainframe university administration standards.

## Features
- **9 Specialized Pages:** Login/Demo Access, Main Dashboard, VSAM Student Records Explorer, Application Batch Queue, Eligibility Evaluation Engine, Disbursement Payment Management, Batch Processing History (JES2 Spool), 132-Column SYSOUT Reports & Analytics, and Dynamic System Configuration.
- **Mainframe Report Import Engine:** Upload actual COBOL-generated `.txt` (132-col ANSI), `.dat` (APBS/NACHA), `.csv`, or `.json` files directly to populate dashboard state.
- **JCL Batch Execution Simulator:** Interactive terminal emulator to submit and monitor `//BATELG01 JOB`, inspecting real-time SYSOUT step return codes (`RC 0000`).
- **VSAM KSDS Hex Dump Inspector:** View low-level 150-byte record offsets, keys, and hexadecimal byte sequences.
- **Zero Frontend Business Rule Logic Compromise:** Visualizes mainframe batch results while respecting mainframe architecture boundaries.

## Build & Run
```bash
npm install
npm run dev
npm run build
```
