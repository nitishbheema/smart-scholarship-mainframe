      *****************************************************************
      * COPYBOOK: SCHAPP.CPY                                          *
      * DESCRIPTION: SCHOLARSHIP APPLICATION BATCH INPUT RECORD       *
      * RECORD LENGTH: 120 BYTES                                      *
      *****************************************************************
       01  SCHOLARSHIP-APP-RECORD.
           05  APP-ID                      PIC X(10).
           05  APP-STU-ID                  PIC X(10).
           05  APP-SCH-CODE                PIC X(06).
           05  APP-DATE                    PIC X(08).
           05  APP-CGPA                    PIC 9(02)V99.
           05  APP-ATTENDANCE              PIC 9(03)V99.
           05  APP-FAMILY-INCOME           PIC 9(08)V99.
           05  APP-ACTIVE-ARREARS          PIC 9(02).
           05  APP-BANK-AC-NUM             PIC X(18).
           05  APP-BANK-IFSC               PIC X(11).
           05  APP-FILLER                  PIC X(36).
