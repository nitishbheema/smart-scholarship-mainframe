      *****************************************************************
      * COPYBOOK: DISBREC.CPY                                         *
      * DESCRIPTION: SCHOLARSHIP DISBURSEMENT PAYMENT INSTRUCTION     *
      * SIMULATED NACHA / APBS / NEFT STANDARD INSTRUCTION FORMAT    *
      * RECORD LENGTH: 120 BYTES                                      *
      *****************************************************************
       01  DISBURSEMENT-RECORD.
           05  DISB-RECORD-TYPE            PIC X(01).
               88  DISB-REC-HEADER         VALUE 'H'.
               88  DISB-REC-DETAIL         VALUE 'D'.
               88  DISB-REC-TRAILER        VALUE 'T'.
           05  DISB-REF-ID                 PIC X(12).
           05  DISB-APP-ID                 PIC X(10).
           05  DISB-STU-ID                 PIC X(10).
           05  DISB-AMOUNT                 PIC 9(07)V99.
           05  DISB-BANK-AC-NUM            PIC X(18).
           05  DISB-BANK-IFSC              PIC X(11).
           05  DISB-STATUS                 PIC X(01).
               88  DISB-STAT-PENDING       VALUE 'P'.
               88  DISB-STAT-SUCCESS       VALUE 'S'.
               88  DISB-STAT-FAILED        VALUE 'F'.
               88  DISB-STAT-HOLD          VALUE 'H'.
           05  DISB-VALUE-DATE             PIC X(08).
           05  DISB-UTR-NUMBER             PIC X(16).
           05  DISB-BATCH-ID               PIC X(10).
           05  DISB-FILLER                 PIC X(14).
