import os

def pad(val, length):
    return str(val).ljust(length)[:length]

def pad_num(val, length):
    return str(val).zfill(length)[:length]

# 1. VSAM Student Master Records (150 bytes each)
students = [
    ("STU2024001", "Aarav Sharma", "20040315", "M", "CS  ", "3", "05", "aarav.sharma@univ.edu", "9876543210", "20220801", "A"),
    ("STU2024002", "Diya Patel", "20031120", "F", "IT  ", "4", "07", "diya.patel@univ.edu", "9876543211", "20210801", "A"),
    ("STU2024003", "Rohan Verma", "20040709", "M", "ECE ", "2", "03", "rohan.verma@univ.edu", "9876543212", "20230801", "A"),
    ("STU2024004", "Ananya Iyer", "20040125", "F", "CS  ", "3", "05", "ananya.iyer@univ.edu", "9876543213", "20220801", "A"),
    ("STU2024005", "Vikram Rao", "20030518", "M", "MECH", "4", "07", "vikram.rao@univ.edu", "9876543214", "20210801", "A"),
    ("STU2024006", "Priya Nair", "20050912", "F", "IT  ", "1", "01", "priya.nair@univ.edu", "9876543215", "20240801", "A"),
    ("STU2024007", "Karthik Reddy", "20041205", "M", "EEE ", "2", "03", "karthik.reddy@univ.edu", "9876543216", "20230801", "A"),
    ("STU2024008", "Sneha Kulkarni", "20030830", "F", "CS  ", "4", "07", "sneha.kulkarni@univ.edu", "9876543217", "20210801", "A"),
    ("STU2024009", "Aditya Mishra", "20040414", "M", "CIVL", "3", "05", "aditya.mishra@univ.edu", "9876543218", "20220801", "A"),
    ("STU2024010", "Meera Menon", "20041022", "F", "ECE ", "3", "05", "meera.menon@univ.edu", "9876543219", "20220801", "A"),
    ("STU2024011", "Arjun Gupta", "20040611", "M", "CS  ", "2", "03", "arjun.gupta@univ.edu", "9876543220", "20230801", "A"),
    ("STU2024012", "Pooja Hegde", "20031201", "F", "IT  ", "4", "07", "pooja.hegde@univ.edu", "9876543221", "20210801", "A"),
    ("STU2024013", "Siddharth Sen", "20040219", "M", "MECH", "3", "05", "siddharth.sen@univ.edu", "9876543222", "20220801", "A"),
    ("STU2024014", "Tanvi Joshi", "20050114", "F", "ECE ", "1", "02", "tanvi.joshi@univ.edu", "9876543223", "20240801", "A"),
    ("STU2024015", "Naveen Kumar", "20030404", "M", "EEE ", "4", "08", "naveen.kumar@univ.edu", "9876543224", "20210801", "A")
]

vsam_lines = []
for s in students:
    rec = (
        pad(s[0], 10) +
        pad(s[1], 30) +
        pad(s[2], 8) +
        pad(s[3], 1) +
        pad(s[4], 4) +
        pad(s[5], 1) +
        pad(s[6], 2) +
        pad(s[7], 35) +
        pad(s[8], 10) +
        pad(s[9], 8) +
        pad(s[10], 1) +
        pad(" " * 40, 40)
    )
    assert len(rec) == 150, f"VSAM Record length {len(rec)} != 150"
    vsam_lines.append(rec)

os.makedirs("mainframe/datasets", exist_ok=True)
with open("mainframe/datasets/STUMAST_SEQ.dat", "w") as f:
    f.write("\n".join(vsam_lines) + "\n")

# 2. Sequential Application Batch Records (120 bytes each)
# Designed to cover ALL 15 Test Scenarios:
# Test 1: Full eligibility (High Merit >= 9.0 CGPA) -> Rs. 20,000
# Test 2: Full eligibility (Tier 2: 8.0 - 8.99 CGPA) -> Rs. 15,000
# Test 3: Full eligibility (Tier 3: 7.5 - 7.99 CGPA) -> Rs. 10,000
# Test 4: Failing CGPA (< 7.50) -> REJ-CGPA
# Test 5: Failing Attendance (< 75%) -> REJ-ATTN
# Test 6: Exceeding Family Income (> Rs. 2,50,000) -> REJ-INCOME
# Test 7: Active Arrears (> 0) -> REJ-ARREAR
# Test 8: Duplicate Student ID in batch -> REJ-DUPAPP / DUP INTERCEPT
# Test 9: Duplicate Application ID in batch -> REJ-DUPAPP
# Test 10: Missing mandatory field (Blank IFSC) -> REJ-INVDAT / Exception
# Test 11: Invalid CGPA (> 10.00) -> REJ-INVDAT / Exception
# Test 12: Invalid Attendance (> 100%) -> REJ-INVDAT / Exception
# Test 13: Multiple Criteria Failed (Low CGPA + High Income) -> REJ-MULTPL
# Test 14: Borderline eligibility (CGPA=7.50, Attn=75.00%, Income=250000) -> ELIGIBLE Rs. 10,000
# Test 15: STEM Grant application (Eligible Tier 1) -> Rs. 20,000

applications = [
    # app_id, stu_id, sch_code, date, cgpa(99v99), attn(999v99), income(9(8)v99), arrears(99), ac_num, ifsc, note
    ("APP2024001", "STU2024001", "MERIT1", "20241010", "0945", "08850", "0018000000", "00", "9182374619283746", "SBIN0001234", "T1: High Merit Tier 1"),
    ("APP2024002", "STU2024002", "MERIT1", "20241010", "0860", "08200", "0021000000", "00", "9182374619283747", "HDFC0002345", "T2: Merit Tier 2"),
    ("APP2024003", "STU2024003", "MERIT1", "20241010", "0775", "07900", "0019500000", "00", "9182374619283748", "ICIC0003456", "T3: Merit Tier 3"),
    ("APP2024004", "STU2024004", "MERIT1", "20241011", "0680", "08500", "0015000000", "00", "9182374619283749", "BARB0COLLEG", "T4: Rej Low CGPA 6.80"),
    ("APP2024005", "STU2024005", "MERIT1", "20241011", "0840", "06850", "0017500000", "00", "9182374619283750", "PUNB0005678", "T5: Rej Low Attn 68.5%"),
    ("APP2024006", "STU2024006", "MERIT1", "20241011", "0890", "09100", "0036000000", "00", "9182374619283751", "CNRB0006789", "T6: Rej High Income 3.6L"),
    ("APP2024007", "STU2024007", "MERIT1", "20241012", "0820", "08400", "0016000000", "02", "9182374619283752", "UBIN0007890", "T7: Rej Active Arrears 2"),
    ("APP2024008", "STU2024001", "MERIT1", "20241012", "0945", "08850", "0018000000", "00", "9182374619283746", "SBIN0001234", "T8: Rej Duplicate Student STU2024001"),
    ("APP2024002", "STU2024008", "MERIT1", "20241012", "0910", "08900", "0014000000", "00", "9182374619283753", "IOBA0008901", "T9: Rej Duplicate App ID APP2024002"),
    ("APP2024010", "STU2024009", "MERIT1", "20241013", "0815", "08100", "0020000000", "00", "9182374619283754", "           ", "T10: Rej Missing IFSC Code"),
    ("APP2024011", "STU2024010", "MERIT1", "20241013", "1150", "08800", "0017000000", "00", "9182374619283755", "KKBK0009012", "T11: Rej Invalid CGPA 11.50"),
    ("APP2024012", "STU2024011", "MERIT1", "20241013", "0870", "10500", "0019000000", "00", "9182374619283756", "YESB0001234", "T12: Rej Invalid Attn 105%"),
    ("APP2024013", "STU2024012", "MERIT1", "20241014", "0650", "06200", "0040000000", "01", "9182374619283757", "IDIB0002345", "T13: Rej Multiple Criteria Failed"),
    ("APP2024014", "STU2024013", "MERIT1", "20241014", "0750", "07500", "0025000000", "00", "9182374619283758", "CORP0003456", "T14: Borderline Eligible Rs. 10k"),
    ("APP2024015", "STU2024014", "TECH02", "20241014", "0965", "09400", "0022000000", "00", "9182374619283759", "AXIS0004567", "T15: Eligible STEM Tier 1 Rs. 20k")
]

app_lines = []
for a in applications:
    rec = (
        pad(a[0], 10) +
        pad(a[1], 10) +
        pad(a[2], 6) +
        pad(a[3], 8) +
        pad_num(a[4], 4) +
        pad_num(a[5], 5) +
        pad_num(a[6], 10) +
        pad_num(a[7], 2) +
        pad(a[8], 18) +
        pad(a[9], 11) +
        pad(" " * 36, 36)
    )
    assert len(rec) == 120, f"App Record length {len(rec)} != 120"
    app_lines.append(rec)

os.makedirs("sample-data/applications", exist_ok=True)
os.makedirs("mainframe/datasets", exist_ok=True)

with open("sample-data/applications/SCHOLARSHIP_APPLICATIONS.dat", "w") as f:
    f.write("\n".join(app_lines) + "\n")

with open("mainframe/datasets/APPL_RAW.dat", "w") as f:
    f.write("\n".join(app_lines) + "\n")

print(f"Generated {len(vsam_lines)} VSAM master records and {len(app_lines)} Application batch records.")
