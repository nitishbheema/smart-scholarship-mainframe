      *****************************************************************
      * COPYBOOK: STUREC.CPY                                          *
      * DESCRIPTION: STUDENT MASTER RECORD DEFINITION (VSAM KSDS / FB)*
      * RECORD LENGTH: 150 BYTES                                      *
      * KEY: STU-ID (10 BYTES, OFFSET 0)                              *
      *****************************************************************
       01  STUDENT-MASTER-RECORD.
           05  STU-ID                      PIC X(10).
           05  STU-NAME                    PIC X(30).
           05  STU-DOB                     PIC X(08).
           05  STU-GENDER                  PIC X(01).
               88  STU-GENDER-MALE         VALUE 'M'.
               88  STU-GENDER-FEMALE       VALUE 'F'.
               88  STU-GENDER-OTHER        VALUE 'O'.
           05  STU-DEPT                    PIC X(04).
               88  STU-DEPT-CS             VALUE 'CS  '.
               88  STU-DEPT-IT             VALUE 'IT  '.
               88  STU-DEPT-ECE            VALUE 'ECE '.
               88  STU-DEPT-EEE            VALUE 'EEE '.
               88  STU-DEPT-MECH           VALUE 'MECH'.
               88  STU-DEPT-CIVIL          VALUE 'CIVL'.
           05  STU-YEAR                    PIC 9(01).
               88  STU-YEAR-VALID          VALUE 1 THRU 4.
           05  STU-SEMESTER                PIC 9(02).
               88  STU-SEMESTER-VALID      VALUE 1 THRU 8.
           05  STU-EMAIL                   PIC X(35).
           05  STU-PHONE                   PIC X(10).
           05  STU-ENROLL-DATE             PIC X(08).
           05  STU-STATUS                  PIC X(01).
               88  STU-STATUS-ACTIVE       VALUE 'A'.
               88  STU-STATUS-SUSPENDED    VALUE 'S'.
               88  STU-STATUS-GRADUATED    VALUE 'G'.
           05  STU-FILLER                  PIC X(40).
