      *****************************************************************
      * COPYBOOK: ELIGREC.CPY                                         *
      * DESCRIPTION: SCHOLARSHIP ELIGIBILITY EVALUATION RESULT RECORD *
      * RECORD LENGTH: 120 BYTES                                      *
      *****************************************************************
       01  ELIGIBILITY-RESULT-RECORD.
           05  ELG-APP-ID                  PIC X(10).
           05  ELG-STU-ID                  PIC X(10).
           05  ELG-SCH-CODE                PIC X(06).
           05  ELG-CGPA                    PIC 9(02)V99.
           05  ELG-ATTENDANCE              PIC 9(03)V99.
           05  ELG-FAMILY-INCOME           PIC 9(08)V99.
           05  ELG-ACTIVE-ARREARS          PIC 9(02).
           05  ELG-STATUS                  PIC X(01).
               88  ELG-STATUS-ELIGIBLE     VALUE 'E'.
               88  ELG-STATUS-REJECTED     VALUE 'R'.
               88  ELG-STATUS-DUPLICATE    VALUE 'D'.
               88  ELG-STATUS-INVALID      VALUE 'I'.
           05  ELG-REASON-CODE             PIC X(10).
               88  ELG-REASON-NONE         VALUE 'NONE      '.
               88  ELG-REASON-CGPA-LOW     VALUE 'REJ-CGPA  '.
               88  ELG-REASON-ATTN-LOW     VALUE 'REJ-ATTN  '.
               88  ELG-REASON-INC-HIGH     VALUE 'REJ-INCOME'.
               88  ELG-REASON-ARREARS      VALUE 'REJ-ARREAR'.
               88  ELG-REASON-DUP-APP      VALUE 'REJ-DUPAPP'.
               88  ELG-REASON-DUP-STU      VALUE 'REJ-DUPSTU'.
               88  ELG-REASON-INV-DATA     VALUE 'REJ-INVDAT'.
               88  ELG-REASON-MULTI        VALUE 'REJ-MULTPL'.
           05  ELG-AWARD-AMOUNT            PIC 9(07)V99.
           05  ELG-PROCESSED-DATE          PIC X(08).
           05  ELG-PROCESSED-TIME          PIC X(06).
           05  ELG-BATCH-ID                PIC X(10).
           05  ELG-FILLER                  PIC X(29).
