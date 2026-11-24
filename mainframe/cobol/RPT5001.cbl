      *****************************************************************
      * PROGRAM:     RPT5001                                          *
      * SYSTEM:      SMART SCHOLARSHIP ELIGIBILITY & DISBURSEMENT     *
      * MODULE:      MAINFRAME 132-COLUMN BATCH REPORT GENERATOR      *
      * AUTHOR:      MAINFRAME ARCHITECT & COBOL SPECIALIST           *
      * ENVIRONMENT: IBM ENTERPRISE COBOL FOR z/OS                    *
      * PURPOSE:     FORMAT ANSI CARRIAGE-CONTROL SYSOUT REPORTS      *
      *              FOR ELIGIBLE, REJECTED, DISBURSEMENT & AUDIT     *
      *****************************************************************
       IDENTIFICATION DIVISION.
       PROGRAM-ID. RPT5001.
       AUTHOR. SENIOR MAINFRAME DEVELOPER.
       INSTALLATION. ENTERPRISE ACADEMIC SYSTEMS.
       DATE-WRITTEN. 2024-10-15.
       DATE-COMPILED. 2024-10-15.

       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       SOURCE-COMPUTER. IBM-ZOS.
       OBJECT-COMPUTER. IBM-ZOS.

       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  WS-PROGRAM-CONSTANTS.
           05  WS-PGM-NAME             PIC X(08) VALUE 'RPT5001 '.
           05  WS-LINES-PER-PAGE       PIC 9(02) VALUE 55.

       01  WS-PAGINATION.
           05  WS-PAGE-NUM-ELG         PIC 9(03) VALUE 1.
           05  WS-LINE-COUNT-ELG       PIC 9(02) VALUE 99.
           05  WS-PAGE-NUM-REJ         PIC 9(03) VALUE 1.
           05  WS-LINE-COUNT-REJ       PIC 9(02) VALUE 99.

       01  WS-DATE-FORMATTED.
           05  WS-RPT-DATE             PIC X(10).
           05  WS-RPT-TIME             PIC X(08).

      * --- REPORT LINE FORMATS (133 BYTES: 1 ANSI CC + 132 DATA) ---
       01  RPT-HEADER-1.
           05  CC-H1                   PIC X(01) VALUE '1'.
           05  FILLER                  PIC X(35) VALUE ALL '*'.
           05  FILLER                  PIC X(62) VALUE
               ' STATE SCHOLARSHIP ELIGIBILITY & DISBURSEMENT SYSTEM '.
           05  FILLER                  PIC X(35) VALUE ALL '*'.

       01  RPT-HEADER-2.
           05  CC-H2                   PIC X(01) VALUE ' '.
           05  FILLER                  PIC X(10) VALUE 'REPORT:   '.
           05  RPT2-TITLE              PIC X(50).
           05  FILLER                  PIC X(10) VALUE 'BATCH ID: '.
           05  RPT2-BATCH-ID           PIC X(10).
           05  FILLER                  PIC X(10) VALUE 'DATE:     '.
           05  RPT2-DATE               PIC X(10).
           05  FILLER                  PIC X(10) VALUE 'PAGE:     '.
           05  RPT2-PAGE               PIC ZZ9.
           05  FILLER                  PIC X(19) VALUE SPACES.

       01  RPT-HEADER-SEPARATOR.
           05  CC-HS                   PIC X(01) VALUE '0'.
           05  FILLER                  PIC X(132) VALUE ALL '-'.

       01  RPT-ELIG-COL-HDR.
           05  CC-ECH                  PIC X(01) VALUE ' '.
           05  ECH-PART1               PIC X(45) VALUE
               'APP ID     STU ID     NAME                   '.
           05  ECH-PART2               PIC X(45) VALUE
               '        SCHEME   CGPA   ATTN%   FAMILY INCOME'.
           05  ECH-PART3               PIC X(42) VALUE
               '  ARRS  AWARD (INR)  STATUS               '.

       01  RPT-ELIG-DETAIL-LINE.
           05  CC-EDET                 PIC X(01) VALUE ' '.
           05  DET-APP-ID              PIC X(10).
           05  FILLER                  PIC X(01) VALUE SPACES.
           05  DET-STU-ID              PIC X(10).
           05  FILLER                  PIC X(01) VALUE SPACES.
           05  DET-STU-NAME            PIC X(30).
           05  FILLER                  PIC X(01) VALUE SPACES.
           05  DET-SCH-CODE            PIC X(06).
           05  FILLER                  PIC X(02) VALUE SPACES.
           05  DET-CGPA                PIC Z9.99.
           05  FILLER                  PIC X(02) VALUE SPACES.
           05  DET-ATTN                PIC ZZ9.99.
           05  FILLER                  PIC X(01) VALUE '%'.
           05  FILLER                  PIC X(02) VALUE SPACES.
           05  DET-INCOME              PIC ZZZ,ZZ9.99.
           05  FILLER                  PIC X(03) VALUE SPACES.
           05  DET-ARREARS             PIC Z9.
           05  FILLER                  PIC X(04) VALUE SPACES.
           05  DET-AWARD               PIC ZZZ,ZZ9.99.
           05  FILLER                  PIC X(04) VALUE SPACES.
           05  DET-STATUS              PIC X(08).
           05  FILLER                  PIC X(14) VALUE SPACES.

       01  RPT-REJ-COL-HDR.
           05  CC-RCH                  PIC X(01) VALUE ' '.
           05  RCH-PART1               PIC X(45) VALUE
               'APP ID     STU ID     NAME                   '.
           05  RCH-PART2               PIC X(45) VALUE
               '        SCHEME   CGPA   ATTN%   FAMILY INCOME'.
           05  RCH-PART3               PIC X(42) VALUE
               '  ARRS  REASON CODE REJECTION DESC        '.

       01  RPT-REJ-DETAIL-LINE.
           05  CC-RDET                 PIC X(01) VALUE ' '.
           05  R-DET-APP-ID            PIC X(10).
           05  FILLER                  PIC X(01) VALUE SPACES.
           05  R-DET-STU-ID            PIC X(10).
           05  FILLER                  PIC X(01) VALUE SPACES.
           05  R-DET-STU-NAME          PIC X(25).
           05  FILLER                  PIC X(01) VALUE SPACES.
           05  R-DET-SCH-CODE          PIC X(06).
           05  FILLER                  PIC X(01) VALUE SPACES.
           05  R-DET-CGPA              PIC Z9.99.
           05  FILLER                  PIC X(01) VALUE SPACES.
           05  R-DET-ATTN              PIC ZZ9.99.
           05  FILLER                  PIC X(01) VALUE '%'.
           05  FILLER                  PIC X(01) VALUE SPACES.
           05  R-DET-INCOME            PIC ZZZ,ZZ9.99.
           05  FILLER                  PIC X(02) VALUE SPACES.
           05  R-DET-ARREARS           PIC Z9.
           05  FILLER                  PIC X(02) VALUE SPACES.
           05  R-DET-REASON-CODE       PIC X(10).
           05  FILLER                  PIC X(02) VALUE SPACES.
           05  R-DET-REASON-DESC       PIC X(30).
           05  FILLER                  PIC X(05) VALUE SPACES.

       01  RPT-TOTAL-LINE.
           05  CC-TOT                  PIC X(01) VALUE '0'.
           05  TOT-LABEL               PIC X(35).
           05  TOT-COUNT               PIC ZZZ,ZZ9.
           05  FILLER                  PIC X(15) VALUE SPACES.
           05  TOT-AMT-LABEL           PIC X(20)
               VALUE 'TOTAL AMOUNT (INR): '.
           05  TOT-AMOUNT              PIC Z,ZZZ,ZZ9.99.
           05  FILLER                  PIC X(40) VALUE SPACES.

       LINKAGE SECTION.
      * --- REPORT CONTROL AREA ---
       01  LS-REPORT-COMM-AREA.
           05  LS-RPT-ACTION           PIC X(06).
               88  LS-ACTION-INIT      VALUE 'INIT  '.
               88  LS-ACTION-PRINT-ELG VALUE 'PRTELG'.
               88  LS-ACTION-PRINT-REJ VALUE 'PRTREJ'.
               88  LS-ACTION-TOTALS    VALUE 'TOTALS'.
           05  LS-RPT-BATCH-ID         PIC X(10).
           05  LS-RPT-RETURN-CODE      PIC 9(04).

      * --- RECORD DATA PASSED FOR PRINTING ---
       COPY ELIGREC.
       COPY STUREC.

       01  LS-RPT-TOTALS-DATA.
           05  LS-TOT-READ             PIC 9(06).
           05  LS-TOT-VALID            PIC 9(06).
           05  LS-TOT-ELIG             PIC 9(06).
           05  LS-TOT-REJ              PIC 9(06).
           05  LS-TOT-DUP              PIC 9(06).
           05  LS-TOT-DISB-AMOUNT      PIC 9(10)V99.

      * --- OUTPUT REPORT LINE BUFFER ---
       01  LS-OUTPUT-LINE              PIC X(133).

       PROCEDURE DIVISION USING LS-REPORT-COMM-AREA
                                ELIGIBILITY-RESULT-RECORD
                                STUDENT-MASTER-RECORD
                                LS-RPT-TOTALS-DATA
                                LS-OUTPUT-LINE.

       0000-MAIN-REPORTING.
           MOVE 0000 TO LS-RPT-RETURN-CODE
           EVALUATE TRUE
               WHEN LS-ACTION-INIT
                   PERFORM 1000-INIT-REPORT
               WHEN LS-ACTION-PRINT-ELG
                   PERFORM 2000-FORMAT-ELIGIBLE-LINE
               WHEN LS-ACTION-PRINT-REJ
                   PERFORM 3000-FORMAT-REJECTED-LINE
               WHEN LS-ACTION-TOTALS
                   PERFORM 4000-FORMAT-SUMMARY-TOTALS
           END-EVALUATE
           GOBACK.

       1000-INIT-REPORT.
           MOVE 1 TO WS-PAGE-NUM-ELG
           MOVE 99 TO WS-LINE-COUNT-ELG
           MOVE 1 TO WS-PAGE-NUM-REJ
           MOVE 99 TO WS-LINE-COUNT-REJ
           MOVE FUNCTION CURRENT-DATE(1:4) TO WS-RPT-DATE(1:4)
           MOVE '-'                        TO WS-RPT-DATE(5:1)
           MOVE FUNCTION CURRENT-DATE(5:2) TO WS-RPT-DATE(6:2)
           MOVE '-'                        TO WS-RPT-DATE(8:1)
           MOVE FUNCTION CURRENT-DATE(7:2) TO WS-RPT-DATE(9:2)
           MOVE '1' TO LS-OUTPUT-LINE(1:1)
           MOVE RPT-HEADER-1 TO LS-OUTPUT-LINE.

       2000-FORMAT-ELIGIBLE-LINE.
           MOVE ELG-APP-ID         TO DET-APP-ID
           MOVE ELG-STU-ID         TO DET-STU-ID
           MOVE STU-NAME           TO DET-STU-NAME
           MOVE ELG-SCH-CODE       TO DET-SCH-CODE
           MOVE ELG-CGPA           TO DET-CGPA
           MOVE ELG-ATTENDANCE     TO DET-ATTN
           MOVE ELG-FAMILY-INCOME  TO DET-INCOME
           MOVE ELG-ACTIVE-ARREARS TO DET-ARREARS
           MOVE ELG-AWARD-AMOUNT   TO DET-AWARD
           MOVE 'ELIGIBLE'         TO DET-STATUS
           MOVE RPT-ELIG-DETAIL-LINE TO LS-OUTPUT-LINE.

       3000-FORMAT-REJECTED-LINE.
           MOVE ELG-APP-ID         TO R-DET-APP-ID
           MOVE ELG-STU-ID         TO R-DET-STU-ID
           MOVE STU-NAME           TO R-DET-STU-NAME
           MOVE ELG-SCH-CODE       TO R-DET-SCH-CODE
           MOVE ELG-CGPA           TO R-DET-CGPA
           MOVE ELG-ATTENDANCE     TO R-DET-ATTN
           MOVE ELG-FAMILY-INCOME  TO R-DET-INCOME
           MOVE ELG-ACTIVE-ARREARS TO R-DET-ARREARS
           MOVE ELG-REASON-CODE    TO R-DET-REASON-CODE

           EVALUATE ELG-REASON-CODE
               WHEN 'REJ-CGPA  '
                   MOVE 'CGPA BELOW 7.50 THRESHOLD    '
                     TO R-DET-REASON-DESC
               WHEN 'REJ-ATTN  '
                   MOVE 'ATTENDANCE BELOW 75% MINIMUM '
                     TO R-DET-REASON-DESC
               WHEN 'REJ-INCOME'
                   MOVE 'INCOME EXCEEDS RS 2,50,000   '
                     TO R-DET-REASON-DESC
               WHEN 'REJ-ARREAR'
                   MOVE 'ACTIVE ARREARS PRESENT       '
                     TO R-DET-REASON-DESC
               WHEN 'REJ-DUPAPP'
                   MOVE 'DUPLICATE APPLICATION IN BATCH'
                     TO R-DET-REASON-DESC
               WHEN 'REJ-DUPSTU'
                   MOVE 'STUDENT ALREADY APPLIED      '
                     TO R-DET-REASON-DESC
               WHEN 'REJ-MULTPL'
                   MOVE 'MULTIPLE CRITERIA FAILED     '
                     TO R-DET-REASON-DESC
               WHEN OTHER
                   MOVE 'ACADEMIC DISQUALIFICATION    '
                     TO R-DET-REASON-DESC
           END-EVALUATE

           MOVE RPT-REJ-DETAIL-LINE TO LS-OUTPUT-LINE.

       4000-FORMAT-SUMMARY-TOTALS.
           MOVE 'TOTAL ELIGIBLE CANDIDATES:     ' TO TOT-LABEL
           MOVE LS-TOT-ELIG TO TOT-COUNT
           MOVE 'TOTAL APPROVED AMOUNT:'          TO TOT-AMT-LABEL
           MOVE LS-TOT-DISB-AMOUNT                TO TOT-AMOUNT
           MOVE RPT-TOTAL-LINE TO LS-OUTPUT-LINE.
