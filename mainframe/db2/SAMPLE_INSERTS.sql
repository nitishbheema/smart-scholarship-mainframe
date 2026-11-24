-- *****************************************************************
-- SCRIPT: SAMPLE_INSERTS.SQL
-- DESCRIPTION: POPULATE SCHOLARSHIP SCHEMES & INITIAL STUDENTS
-- *****************************************************************

-- SCHOLARSHIP MASTER SCHEMES
INSERT INTO SCHOLARSHIP_MASTER 
(SCH_CODE, SCH_NAME, SCH_DESC, MIN_CGPA, MIN_ATTENDANCE, MAX_ANNUAL_INCOME, MAX_ACTIVE_ARREARS, IS_ACTIVE)
VALUES 
('MERIT1', 'National Higher Education Merit Scheme', 'State-sponsored merit grant for high academic achievers', 7.50, 75.00, 250000.00, 0, 'Y'),
('TECH02', 'STEM Excellence Technical Grant', 'Technology & Engineering department research allowance', 8.00, 80.00, 300000.00, 0, 'Y'),
('NEED01', 'Economically Weaker Section Support', 'Financial assistance for underprivileged students', 6.50, 70.00, 150000.00, 1, 'Y');

-- SAMPLE STUDENTS FOR STUDENT_MASTER (SYNTHETIC BENCHMARK DATA)
INSERT INTO STUDENT_MASTER 
(STU_ID, FIRST_NAME, LAST_NAME, DOB, GENDER, DEPARTMENT, YEAR_OF_STUDY, SEMESTER, EMAIL, PHONE, ENROLL_DATE, STATUS)
VALUES
('STU2024001', 'Aarav', 'Sharma', '2004-03-15', 'M', 'CS  ', 3, 5, 'aarav.sharma@univ.edu', '9876543210', '2022-08-01', 'A'),
('STU2024002', 'Diya', 'Patel', '2003-11-20', 'F', 'IT  ', 4, 7, 'diya.patel@univ.edu', '9876543211', '2021-08-01', 'A'),
('STU2024003', 'Rohan', 'Verma', '2004-07-09', 'M', 'ECE ', 2, 3, 'rohan.verma@univ.edu', '9876543212', '2023-08-01', 'A'),
('STU2024004', 'Ananya', 'Iyer', '2004-01-25', 'F', 'CS  ', 3, 5, 'ananya.iyer@univ.edu', '9876543213', '2022-08-01', 'A'),
('STU2024005', 'Vikram', 'Rao', '2003-05-18', 'M', 'MECH', 4, 7, 'vikram.rao@univ.edu', '9876543214', '2021-08-01', 'A'),
('STU2024006', 'Priya', 'Nair', '2005-09-12', 'F', 'IT  ', 1, 1, 'priya.nair@univ.edu', '9876543215', '2024-08-01', 'A'),
('STU2024007', 'Karthik', 'Reddy', '2004-12-05', 'M', 'EEE ', 2, 3, 'karthik.reddy@univ.edu', '9876543216', '2023-08-01', 'A'),
('STU2024008', 'Sneha', 'Kulkarni', '2003-08-30', 'F', 'CS  ', 4, 7, 'sneha.kulkarni@univ.edu', '9876543217', '2021-08-01', 'A'),
('STU2024009', 'Aditya', 'Mishra', '2004-04-14', 'M', 'CIVL', 3, 5, 'aditya.mishra@univ.edu', '9876543218', '2022-08-01', 'A'),
('STU2024010', 'Meera', 'Menon', '2004-10-22', 'F', 'ECE ', 3, 5, 'meera.menon@univ.edu', '9876543219', '2022-08-01', 'A');
