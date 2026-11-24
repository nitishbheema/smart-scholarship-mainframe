      *****************************************************************
      * COPYBOOK: DCLSCH.CPY                                          *
      * DESCRIPTION: DB2 DCLGEN DECLARATIONS FOR SCHOLARSHIP SYSTEM   *
      *****************************************************************
      * --- DCLGEN FOR TABLE: SCHOLARSHIP_APPLICATION ---
       01  DCL-SCHOLARSHIP-APP.
           10  H-APP-ID                    PIC X(10).
           10  H-APP-STU-ID                PIC X(10).
           10  H-APP-SCH-CODE              PIC X(06).
           10  H-APP-DATE                  PIC X(10).
           10  H-APP-CGPA                  PIC S9(02)V99 COMP-3.
           10  H-APP-ATTENDANCE            PIC S9(03)V99 COMP-3.
           10  H-APP-FAMILY-INCOME         PIC S9(08)V99 COMP-3.
           10  H-APP-ACTIVE-ARREARS        PIC S9(04) COMP-4.
           10  H-APP-BANK-AC-NUM           PIC X(18).
           10  H-APP-BANK-IFSC             PIC X(11).
           10  H-APP-STATUS                PIC X(10).

      * --- DCLGEN FOR TABLE: ELIGIBILITY_RESULT ---
       01  DCL-ELIGIBILITY-RESULT.
           10  H-ELG-APP-ID                PIC X(10).
           10  H-ELG-STU-ID                PIC X(10).
           10  H-ELG-SCH-CODE              PIC X(06).
           10  H-ELG-STATUS                PIC X(01).
           10  H-ELG-REASON-CODE           PIC X(10).
           10  H-ELG-AWARD-AMOUNT          PIC S9(07)V99 COMP-3.
           10  H-ELG-PROCESSED-TS          PIC X(26).
           10  H-ELG-BATCH-ID              PIC X(10).

      * --- DCLGEN FOR TABLE: DISBURSEMENT_RECORD ---
       01  DCL-DISBURSEMENT-RECORD.
           10  H-DISB-REF-ID               PIC X(12).
           10  H-DISB-APP-ID               PIC X(10).
           10  H-DISB-STU-ID               PIC X(10).
           10  H-DISB-AMOUNT               PIC S9(07)V99 COMP-3.
           10  H-DISB-BANK-AC-NUM          PIC X(18).
           10  H-DISB-BANK-IFSC            PIC X(11).
           10  H-DISB-STATUS               PIC X(10).
           10  H-DISB-UTR-NUMBER           PIC X(16).
           10  H-DISB-BATCH-ID             PIC X(10).
           10  H-DISB-DISBURSED-TS         PIC X(26).

      * --- DCLGEN FOR TABLE: PROCESSING_AUDIT ---
       01  DCL-PROCESSING-AUDIT.
           10  H-AUD-BATCH-ID              PIC X(10).
           10  H-AUD-JOB-NAME              PIC X(08).
           10  H-AUD-RECS-READ             PIC S9(09) COMP-4.
           10  H-AUD-RECS-VALID            PIC S9(09) COMP-4.
           10  H-AUD-RECS-ELIG             PIC S9(09) COMP-4.
           10  H-AUD-RECS-REJ              PIC S9(09) COMP-4.
           10  H-AUD-RECS-DUP              PIC S9(09) COMP-4.
           10  H-AUD-TOTAL-AMOUNT          PIC S9(09)V99 COMP-3.
           10  H-AUD-RETURN-CODE           PIC S9(04) COMP-4.
           10  H-AUD-START-TS              PIC X(26).
           10  H-AUD-END-TS                PIC X(26).
