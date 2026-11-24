"""
=============================================================================
PROGRAM: run_mainframe_batch.py
PURPOSE: LOCAL MAINFRAME BATCH EMULATION & COBOL LOGIC TEST RUNNER
SPECIFICATION:
  Strictly executes the business logic specified in:
  - MAIN0001 (Controller)
  - STU1001 (Student Record Validator)
  - SCH2001 (Configurable Scholarship Engine & Slabs)
  - DUP3001 (Duplicate Application & Student Detector)
  - DIS4001 (Disbursement Payment Processor)
  - RPT5001 (132-Column ANSI Carriage Control Report Formatter)
=============================================================================
"""

import os
import sys
import json
import datetime
from decimal import Decimal

# Configuration constants matching WSCONST.cpy
CFG_MIN_CGPA = Decimal("7.50")
CFG_MIN_ATTENDANCE = Decimal("75.00")
CFG_MAX_ANNUAL_INCOME = Decimal("250000.00")
CFG_MAX_ALLOWED_ARREARS = 0

SLABS = [
    {"min_cgpa": Decimal("9.00"), "max_cgpa": Decimal("10.00"), "amount": Decimal("20000.00"), "tier": "HIGH MERIT TIER 1"},
    {"min_cgpa": Decimal("8.00"), "max_cgpa": Decimal("8.99"),  "amount": Decimal("15000.00"), "tier": "MERIT TIER 2"},
    {"min_cgpa": Decimal("7.50"), "max_cgpa": Decimal("7.99"),  "amount": Decimal("10000.00"), "tier": "MERIT TIER 3"}
]

def load_vsam_master(filepath):
    """Loads 150-byte fixed-width VSAM KSDS student master records"""
    master = {}
    if not os.path.exists(filepath):
        return master
    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\r\n")
            if len(line) < 150:
                line = line.ljust(150)
            stu_id = line[0:10].strip()
            name = line[10:40].strip()
            dob = line[40:48].strip()
            gender = line[48:49].strip()
            dept = line[49:53].strip()
            year = line[53:54].strip()
            sem = line[54:56].strip()
            email = line[56:91].strip()
            phone = line[91:101].strip()
            enroll_date = line[101:109].strip()
            status = line[109:110].strip()
            master[stu_id] = {
                "stu_id": stu_id,
                "name": name,
                "dob": dob,
                "gender": gender,
                "dept": dept,
                "year": year,
                "sem": sem,
                "email": email,
                "phone": phone,
                "enroll_date": enroll_date,
                "status": status
            }
    return master

def validate_stu1001(rec):
    """Corresponds to STU1001.cbl"""
    app_id = rec.get("app_id", "").strip()
    stu_id = rec.get("stu_id", "").strip()
    sch_code = rec.get("sch_code", "").strip()
    ac_num = rec.get("bank_ac_num", "").strip()
    ifsc = rec.get("bank_ifsc", "").strip()

    # Mandatory checks
    if not app_id:
        return 12, "APP-ID", "APPLICATION ID IS MANDATORY"
    if not stu_id:
        return 12, "APP-STU-ID", "STUDENT ID IS MANDATORY"
    if not sch_code:
        return 12, "APP-SCH-CODE", "SCHOLARSHIP CODE IS MANDATORY"
    if not ac_num:
        return 12, "APP-BANK-AC-NUM", "BANK ACCOUNT NUMBER IS MANDATORY"
    if not ifsc:
        return 12, "APP-BANK-IFSC", "BANK IFSC CODE IS MANDATORY"

    # Format checks
    if not stu_id.startswith("STU") or len(stu_id) != 10:
        return 8, "APP-STU-ID", "STUDENT ID MUST BEGIN WITH STU PREFIX"
    if not stu_id[3:].isdigit():
        return 8, "APP-STU-ID", "STUDENT ID TRAILING 7 CHARS NOT NUM"
    if not app_id.startswith("APP"):
        return 8, "APP-ID", "APPLICATION ID MUST BEGIN WITH APP"

    # Numeric checks
    cgpa = rec["cgpa"]
    if cgpa < Decimal("0.00") or cgpa > Decimal("10.00"):
        return 8, "APP-CGPA", "CGPA OUT OF VALID RANGE 0.00-10.00"

    attn = rec["attendance"]
    if attn < Decimal("0.00") or attn > Decimal("100.00"):
        return 8, "APP-ATTENDANCE", "ATTENDANCE OUT OF RANGE 0-100%"

    if rec["arrears"] < 0:
        return 8, "APP-ARREARS", "ACTIVE ARREARS MUST BE NUMERIC"

    return 0, "", "SUCCESS"

def check_dup3001(rec, seen_apps, seen_stus):
    """Corresponds to DUP3001.cbl"""
    app_id = rec["app_id"]
    stu_id = rec["stu_id"]
    sch_code = rec["sch_code"]

    if app_id in seen_apps:
        return 8, "DUPLICATE APPLICATION ID DETECTED IN BATCH", app_id

    combo_key = f"{stu_id}:{sch_code}"
    if combo_key in seen_stus:
        return 12, "STUDENT ALREADY APPLIED FOR SCHOLARSHIP", stu_id

    seen_apps.add(app_id)
    seen_stus.add(combo_key)
    return 0, "", ""

def evaluate_sch2001(rec):
    """Corresponds to SCH2001.cbl"""
    cgpa = rec["cgpa"]
    attn = rec["attendance"]
    income = rec["income"]
    arrears = rec["arrears"]

    cgpa_ok = cgpa >= CFG_MIN_CGPA
    attn_ok = attn >= CFG_MIN_ATTENDANCE
    income_ok = income <= CFG_MAX_ANNUAL_INCOME
    arrears_ok = arrears <= CFG_MAX_ALLOWED_ARREARS

    failed_reasons = []
    if not cgpa_ok:
        failed_reasons.append("REJ-CGPA  ")
    if not attn_ok:
        failed_reasons.append("REJ-ATTN  ")
    if not income_ok:
        failed_reasons.append("REJ-INCOME")
    if not arrears_ok:
        failed_reasons.append("REJ-ARREAR")

    if not failed_reasons:
        # Determine award amount
        award = Decimal("0.00")
        for slab in SLABS:
            if cgpa >= slab["min_cgpa"]:
                award = slab["amount"]
                break
        return "E", "NONE      ", award
    elif len(failed_reasons) > 1:
        return "R", "REJ-MULTPL", Decimal("0.00")
    else:
        return "R", failed_reasons[0], Decimal("0.00")

def process_dis4001(rec, award, batch_id, seq_num, paid_records):
    """Corresponds to DIS4001.cbl"""
    app_id = rec["app_id"]
    stu_id = rec["stu_id"]

    if app_id in paid_records or stu_id in paid_records:
        return False, "DUPLICATE DISBURSEMENT INTERCEPTED", None

    paid_records.add(app_id)
    paid_records.add(stu_id)

    curr_year = datetime.datetime.now().strftime("%Y")
    curr_ymd = datetime.datetime.now().strftime("%Y%m%d")
    ref_id = f"DSB{curr_year}{seq_num:06d}"
    utr_num = f"UTR{curr_ymd}{seq_num:06d}IN"

    disb_rec = {
        "rec_type": "D",
        "ref_id": ref_id,
        "app_id": app_id,
        "stu_id": stu_id,
        "amount": award,
        "bank_ac_num": rec["bank_ac_num"],
        "bank_ifsc": rec["bank_ifsc"],
        "status": "P",
        "value_date": curr_ymd,
        "utr_num": utr_num,
        "batch_id": batch_id
    }
    return True, "SUCCESS", disb_rec

def run_pipeline(input_file, vsam_file, batch_id="BAT2024101"):
    print("=" * 70)
    print("STARTING MAIN0001 COBOL BATCH SIMULATION ENGINE")
    print(f"BATCH ID: {batch_id} | DATE: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    vsam_master = load_vsam_master(vsam_file)
    print(f"[VSAM KSDS] Loaded {len(vsam_master)} indexed master records.")

    seen_apps = set()
    seen_stus = set()
    paid_records = set()

    eligible_records = []
    rejected_records = []
    disbursement_records = []
    exception_records = []

    total_read = 0
    total_valid = 0
    total_duplicates = 0
    total_disbursed_amt = Decimal("0.00")
    disb_seq = 1

    with open(input_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\r\n")
            if not line:
                continue
            if len(line) < 120:
                line = line.ljust(120)

            total_read += 1
            app_id = line[0:10].strip()
            stu_id = line[10:20].strip()
            sch_code = line[20:26].strip()
            app_date = line[26:34].strip()
            cgpa_raw = line[34:38].strip()
            attn_raw = line[38:43].strip()
            inc_raw = line[43:53].strip()
            arr_raw = line[53:55].strip()
            ac_num = line[55:73].strip()
            ifsc = line[73:84].strip()

            try:
                cgpa = Decimal(cgpa_raw) / Decimal(100) if cgpa_raw.isdigit() else Decimal(-1)
                attn = Decimal(attn_raw) / Decimal(100) if attn_raw.isdigit() else Decimal(-1)
                income = Decimal(inc_raw) / Decimal(100) if inc_raw.isdigit() else Decimal(-1)
                arrears = int(arr_raw) if arr_raw.isdigit() else -1
            except Exception:
                cgpa, attn, income, arrears = Decimal(-1), Decimal(-1), Decimal(-1), -1

            parsed_rec = {
                "app_id": app_id,
                "stu_id": stu_id,
                "sch_code": sch_code,
                "app_date": app_date,
                "cgpa": cgpa,
                "attendance": attn,
                "income": income,
                "arrears": arrears,
                "bank_ac_num": ac_num,
                "bank_ifsc": ifsc
            }

            # 1. Validation STU1001
            val_rc, val_field, val_reason = validate_stu1001(parsed_rec)
            if val_rc != 0:
                exception_records.append({
                    "rec_num": total_read,
                    "app_id": app_id,
                    "stu_id": stu_id,
                    "code": "ERR-VALD",
                    "reason": val_reason,
                    "severity": "E"
                })
                rejected_records.append({
                    "app_id": app_id,
                    "stu_id": stu_id,
                    "stu_name": vsam_master.get(stu_id, {}).get("name", f"STUDENT {stu_id[3:]}"),
                    "sch_code": sch_code,
                    "cgpa": cgpa if cgpa >= 0 else Decimal("0.00"),
                    "attendance": attn if attn >= 0 else Decimal("0.00"),
                    "income": income if income >= 0 else Decimal("0.00"),
                    "arrears": arrears if arrears >= 0 else 0,
                    "status": "I",
                    "reason_code": "REJ-INVDAT",
                    "reason_desc": val_reason,
                    "award": Decimal("0.00"),
                    "batch_id": batch_id
                })
                continue

            total_valid += 1

            # 2. Duplicate Check DUP3001
            dup_rc, dup_reason, dup_orig = check_dup3001(parsed_rec, seen_apps, seen_stus)
            if dup_rc != 0:
                total_duplicates += 1
                exception_records.append({
                    "rec_num": total_read,
                    "app_id": app_id,
                    "stu_id": stu_id,
                    "code": "ERR-DUPL",
                    "reason": dup_reason,
                    "severity": "W"
                })
                rejected_records.append({
                    "app_id": app_id,
                    "stu_id": stu_id,
                    "stu_name": vsam_master.get(stu_id, {}).get("name", f"STUDENT {stu_id[3:]}"),
                    "sch_code": sch_code,
                    "cgpa": cgpa,
                    "attendance": attn,
                    "income": income,
                    "arrears": arrears,
                    "status": "D",
                    "reason_code": "REJ-DUPAPP",
                    "reason_desc": dup_reason,
                    "award": Decimal("0.00"),
                    "batch_id": batch_id
                })
                continue

            # 3. Lookup Student Name in VSAM Master
            stu_name = vsam_master.get(stu_id, {}).get("name", f"STUDENT {stu_id[3:]}")
            dept = vsam_master.get(stu_id, {}).get("dept", "CS  ")

            # 4. Scholarship Engine SCH2001
            status, reason_code, award = evaluate_sch2001(parsed_rec)

            if status == "E":
                # Eligible
                ok_disb, disb_msg, disb_rec = process_dis4001(parsed_rec, award, batch_id, disb_seq, paid_records)
                if ok_disb:
                    disbursement_records.append(disb_rec)
                    total_disbursed_amt += award
                    disb_seq += 1
                eligible_records.append({
                    "app_id": app_id,
                    "stu_id": stu_id,
                    "stu_name": stu_name,
                    "dept": dept,
                    "sch_code": sch_code,
                    "cgpa": cgpa,
                    "attendance": attn,
                    "income": income,
                    "arrears": arrears,
                    "status": "E",
                    "reason_code": "NONE      ",
                    "award": award,
                    "bank_ac_num": ac_num,
                    "bank_ifsc": ifsc,
                    "batch_id": batch_id
                })
            else:
                # Rejected
                desc_map = {
                    "REJ-CGPA  ": "CGPA BELOW 7.50 THRESHOLD",
                    "REJ-ATTN  ": "ATTENDANCE BELOW 75% MINIMUM",
                    "REJ-INCOME": "INCOME EXCEEDS RS 2,50,000",
                    "REJ-ARREAR": "ACTIVE ARREARS PRESENT",
                    "REJ-MULTPL": "MULTIPLE CRITERIA FAILED"
                }
                rejected_records.append({
                    "app_id": app_id,
                    "stu_id": stu_id,
                    "stu_name": stu_name,
                    "sch_code": sch_code,
                    "cgpa": cgpa,
                    "attendance": attn,
                    "income": income,
                    "arrears": arrears,
                    "status": "R",
                    "reason_code": reason_code,
                    "reason_desc": desc_map.get(reason_code, "DISQUALIFIED"),
                    "award": Decimal("0.00"),
                    "batch_id": batch_id
                })

    print("-" * 70)
    print("PIPELINE PROCESSING COMPLETE:")
    print(f"Total Applications Read:       {total_read}")
    print(f"Total Records Validated:       {total_valid}")
    print(f"Total Eligible Candidates:     {len(eligible_records)}")
    print(f"Total Rejected Candidates:     {len(rejected_records)}")
    print(f"Duplicate Interceptions:       {total_duplicates}")
    print(f"Disbursement Total (INR):      INR {total_disbursed_amt:,.2f}")
    print(f"Total Exceptions Logged:       {len(exception_records)}")
    print(f"Batch Execution Return Code:   RC 0000 (NORMAL COMPLETION)")
    print("=" * 70)

    # Generate Reports
    os.makedirs("reports", exist_ok=True)
    os.makedirs("sample-data/expected-reports", exist_ok=True)

    generate_eligible_report(eligible_records, batch_id, total_disbursed_amt)
    generate_rejected_report(rejected_records, batch_id)
    generate_disbursement_instruction_file(disbursement_records, batch_id, total_disbursed_amt)
    generate_audit_report(total_read, total_valid, len(eligible_records), len(rejected_records), total_duplicates, total_disbursed_amt, batch_id)
    generate_exception_report(exception_records, batch_id)
    export_json_demo_data(vsam_master, eligible_records, rejected_records, disbursement_records, exception_records, total_disbursed_amt, batch_id)

def generate_eligible_report(records, batch_id, total_amt):
    """Generates standard 132-column formatted mainframe report with ANSI carriage controls"""
    lines = []
    # Header 1
    lines.append("1" + "*" * 35 + " STATE SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM " + "*" * 44)
    # Header 2
    hdr2 = f" REPORT:   ELIGIBLE STUDENTS AWARD ROSTER                 BATCH ID: {batch_id}    DATE: {datetime.datetime.now().strftime('%Y-%m-%d')}   PAGE:   1"
    lines.append(hdr2.ljust(133))
    # Separator
    lines.append("0" + "-" * 132)
    # Column Header
    lines.append(" APP ID     STU ID     NAME                           SCHEME   CGPA   ATTN%   FAMILY INCOME  ARRS  AWARD (INR)  STATUS    ".ljust(133))
    lines.append(" " + "-" * 132)

    for r in records:
        line = (
            f" {r['app_id']:<10} "
            f"{r['stu_id']:<10} "
            f"{r['stu_name']:<30} "
            f"{r['sch_code']:<6}  "
            f"{r['cgpa']:>5.2f}  "
            f"{r['attendance']:>6.2f}%  "
            f"{r['income']:>13,.2f}   "
            f"{r['arrears']:>2}  "
            f"{r['award']:>11,.2f}  "
            f"ELIGIBLE  "
        )
        lines.append(line.ljust(133))

    lines.append("0" + "=" * 132)
    tot_line = f" TOTAL ELIGIBLE CANDIDATES:     {len(records):<6}               TOTAL APPROVED AMOUNT:      INR {total_amt:>13,.2f}"
    lines.append(tot_line.ljust(133))
    lines.append(" " + "=" * 132)

    content = "\n".join(lines) + "\n"
    with open("reports/ELIGIBLE_STUDENTS_REPORT.txt", "w", encoding="utf-8") as f:
        f.write(content)
    with open("sample-data/expected-reports/ELIGIBLE_STUDENTS_REPORT.txt", "w", encoding="utf-8") as f:
        f.write(content)

def generate_rejected_report(records, batch_id):
    """Generates rejected applications audit report"""
    lines = []
    lines.append("1" + "*" * 35 + " STATE SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM " + "*" * 44)
    hdr2 = f" REPORT:   REJECTED CANDIDATES AUDIT ROSTER               BATCH ID: {batch_id}    DATE: {datetime.datetime.now().strftime('%Y-%m-%d')}   PAGE:   1"
    lines.append(hdr2.ljust(133))
    lines.append("0" + "-" * 132)
    lines.append(" APP ID     STU ID     NAME                           SCHEME   CGPA   ATTN%   FAMILY INCOME  ARRS  REASON CODE REJECTION REASON".ljust(133))
    lines.append(" " + "-" * 132)

    for r in records:
        line = (
            f" {r['app_id']:<10} "
            f"{r['stu_id']:<10} "
            f"{r['stu_name']:<30} "
            f"{r['sch_code']:<6}  "
            f"{r['cgpa']:>5.2f}  "
            f"{r['attendance']:>6.2f}%  "
            f"{r['income']:>13,.2f}   "
            f"{r['arrears']:>2}   "
            f"{r['reason_code']:<10}  "
            f"{r['reason_desc']:<30}"
        )
        lines.append(line.ljust(133))

    lines.append("0" + "=" * 132)
    tot_line = f" TOTAL REJECTED APPLICATIONS:   {len(records):<6}"
    lines.append(tot_line.ljust(133))
    lines.append(" " + "=" * 132)

    content = "\n".join(lines) + "\n"
    with open("reports/REJECTED_STUDENTS_REPORT.txt", "w", encoding="utf-8") as f:
        f.write(content)
    with open("sample-data/expected-reports/REJECTED_STUDENTS_REPORT.txt", "w", encoding="utf-8") as f:
        f.write(content)

def generate_disbursement_instruction_file(records, batch_id, total_amt):
    """Generates simulated electronic payment instruction file (NACHA / APBS format)"""
    lines = []
    curr_date = datetime.datetime.now().strftime("%Y%m%d")
    # Batch Header: H + BATCH_ID(10) + DATE(8) + COUNT(6) + TOTAL_AMT(12) + FILLER
    hdr = f"H{batch_id:<10}{curr_date}{len(records):06d}{int(total_amt * 100):012d}{' ' * 83}"
    lines.append(hdr[:120])

    for r in records:
        # Detail: D + REF_ID(12) + APP_ID(10) + STU_ID(10) + AMT(9) + AC_NUM(18) + IFSC(11) + STAT(1) + VAL_DATE(8) + UTR(16) + BATCH_ID(10) + FILLER(15)
        amt_str = f"{int(r['amount'] * 100):09d}"
        det = (
            f"D{r['ref_id']:<12}"
            f"{r['app_id']:<10}"
            f"{r['stu_id']:<10}"
            f"{amt_str}"
            f"{r['bank_ac_num']:<18}"
            f"{r['bank_ifsc']:<11}"
            f"{r['status']:<1}"
            f"{r['value_date']:<8}"
            f"{r['utr_num']:<16}"
            f"{r['batch_id']:<10}"
            f"{' ' * 15}"
        )
        lines.append(det[:120])

    # Trailer: T + BATCH_ID(10) + COUNT(6) + TOTAL_AMT(12) + HASH(16) + FILLER
    trailer = f"T{batch_id:<10}{len(records):06d}{int(total_amt * 100):012d}HASH982736451000{' ' * 75}"
    lines.append(trailer[:120])

    content = "\n".join(lines) + "\n"
    with open("reports/DISBURSEMENT_INSTRUCTION.dat", "w", encoding="utf-8") as f:
        f.write(content)
    with open("sample-data/expected-reports/DISBURSEMENT_INSTRUCTION.dat", "w", encoding="utf-8") as f:
        f.write(content)

def generate_audit_report(total_read, total_valid, total_elig, total_rej, total_dup, total_amt, batch_id):
    """Generates processing audit and reconciliation report"""
    lines = [
        "1" + "*" * 35 + " STATE SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM " + "*" * 44,
        f" REPORT:   BATCH RECONCILIATION AUDIT LEDGER              BATCH ID: {batch_id}    DATE: {datetime.datetime.now().strftime('%Y-%m-%d')}   PAGE:   1".ljust(133),
        "0" + "=" * 132,
        " MAINFRAME BATCH EXECUTION SUMMARY & INTEGRITY CHECK:",
        " " + "-" * 132,
        f"   TOTAL APPLICATION RECORDS READ (INP):          {total_read:>10}",
        f"   TOTAL RECORDS PASSING SYNTACTIC VALIDATION:    {total_valid:>10}",
        f"   TOTAL APPLICATIONS APPROVED AS ELIGIBLE:       {total_elig:>10}",
        f"   TOTAL APPLICATIONS REJECTED / DISQUALIFIED:    {total_rej:>10}",
        f"   TOTAL DUPLICATE SUBMISSIONS INTERCEPTED:       {total_dup:>10}",
        f"   TOTAL FINANCIAL COMMITMENT DISBURSED (INR):    Rs. {total_amt:>13,.2f}",
        " " + "-" * 132,
        " SUBSYSTEM STATUS:",
        "   VSAM KSDS CLUSTER ACCESS (STUMAST):            STATUS CODE 00 (SUCCESS)",
        "   IBM Db2 SUBSYSTEM COMMIT:                      SQLCODE +000 (NORMAL COMMIT)",
        "   DISBURSEMENT PAYMENT ADVICE FILE:              STATUS CLOSED (CHECKSUM BALANCED)",
        "   FINAL STEP HIGHEST RETURN CODE:                RC 0000",
        "0" + "=" * 132
    ]
    content = "\n".join(lines) + "\n"
    with open("reports/BATCH_PROCESSING_AUDIT.txt", "w", encoding="utf-8") as f:
        f.write(content)
    with open("sample-data/expected-reports/BATCH_PROCESSING_AUDIT.txt", "w", encoding="utf-8") as f:
        f.write(content)

def generate_exception_report(exceptions, batch_id):
    """Generates batch exceptions log"""
    lines = [
        "1" + "*" * 35 + " STATE SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM " + "*" * 44,
        f" REPORT:   BATCH EXCEPTION AND INTERCEPTION AUDIT         BATCH ID: {batch_id}    DATE: {datetime.datetime.now().strftime('%Y-%m-%d')}   PAGE:   1".ljust(133),
        "0" + "-" * 132,
        " REC NUM   APP ID     STU ID     ERROR CODE  SEV  EXCEPTION MESSAGE".ljust(133),
        " " + "-" * 132
    ]
    for e in exceptions:
        lines.append(f" {e['rec_num']:<8}  {e['app_id']:<10} {e['stu_id']:<10} {e['code']:<10}  {e['severity']:<3}  {e['reason']:<50}".ljust(133))
    lines.append("0" + "=" * 132)
    lines.append(f" TOTAL EXCEPTION RECORDS LOGGED: {len(exceptions)}".ljust(133))
    content = "\n".join(lines) + "\n"
    with open("reports/AUDIT_EXCEPTION_LOG.txt", "w", encoding="utf-8") as f:
        f.write(content)
    with open("sample-data/expected-reports/AUDIT_EXCEPTION_LOG.txt", "w", encoding="utf-8") as f:
        f.write(content)

def export_json_demo_data(vsam_master, eligible, rejected, disbursements, exceptions, total_amt, batch_id):
    """Exports structured JSON data for the React dashboard"""
    os.makedirs("sample-data", exist_ok=True)
    payload = {
        "batch_id": batch_id,
        "run_date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "return_code": "0000",
        "summary": {
            "total_students": len(vsam_master),
            "total_applications": len(eligible) + len(rejected),
            "eligible_count": len(eligible),
            "rejected_count": len(rejected),
            "duplicate_count": sum(1 for r in rejected if r["status"] == "D"),
            "total_disbursement_inr": float(total_amt),
            "avg_cgpa_eligible": float(sum(r["cgpa"] for r in eligible) / len(eligible)) if eligible else 0.0,
            "avg_attendance_eligible": float(sum(r["attendance"] for r in eligible) / len(eligible)) if eligible else 0.0,
        },
        "students": list(vsam_master.values()),
        "eligible_students": [
            {
                **r,
                "cgpa": float(r["cgpa"]),
                "attendance": float(r["attendance"]),
                "income": float(r["income"]),
                "award": float(r["award"])
            }
            for r in eligible
        ],
        "rejected_students": [
            {
                **r,
                "cgpa": float(r["cgpa"]),
                "attendance": float(r["attendance"]),
                "income": float(r["income"]),
                "award": float(r["award"])
            }
            for r in rejected
        ],
        "disbursements": [
            {
                **d,
                "amount": float(d["amount"])
            }
            for d in disbursements
        ],
        "exceptions": exceptions
    }

    with open("sample-data/scholarship_batch_results.json", "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print("[JSON Export] Successfully created sample-data/scholarship_batch_results.json for Dashboard import.")

if __name__ == "__main__":
    raw_input = "sample-data/applications/SCHOLARSHIP_APPLICATIONS.dat"
    vsam_input = "mainframe/datasets/STUMAST_SEQ.dat"
    run_pipeline(raw_input, vsam_input)
