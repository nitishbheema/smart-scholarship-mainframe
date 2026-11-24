      *****************************************************************
      * COPYBOOK: ERRREC.CPY                                          *
      * DESCRIPTION: BATCH PROCESSING EXCEPTION AUDIT RECORD          *
      * RECORD LENGTH: 120 BYTES                                      *
      *****************************************************************
       01  EXCEPTION-RECORD.
           05  EXC-TIMESTAMP               PIC X(14).
           05  EXC-RECORD-NUM              PIC 9(08).
           05  EXC-APP-ID                  PIC X(10).
           05  EXC-STU-ID                  PIC X(10).
           05  EXC-ERROR-CODE              PIC X(08).
               88  EXC-ERR-INV-STUID       VALUE 'ERR-STID '.
               88  EXC-ERR-INV-CGPA        VALUE 'ERR-CGPA '.
               88  EXC-ERR-INV-ATTN        VALUE 'ERR-ATTN '.
               88  EXC-ERR-INV-INCM        VALUE 'ERR-INCM '.
               88  EXC-ERR-INV-ARRS        VALUE 'ERR-ARRS '.
               88  EXC-ERR-MISS-DATA       VALUE 'ERR-MISS '.
               88  EXC-ERR-DUP-STUID       VALUE 'ERR-DUPS '.
               88  EXC-ERR-DUP-APPID       VALUE 'ERR-DUPA '.
               88  EXC-ERR-VSAM-FAIL       VALUE 'ERR-VSAM '.
               88  EXC-ERR-DB2-FAIL        VALUE 'ERR-DB2  '.
           05  EXC-ERROR-MSG               PIC X(45).
           05  EXC-SEVERITY                PIC X(01).
               88  EXC-SEV-WARNING         VALUE 'W'.
               88  EXC-SEV-ERROR           VALUE 'E'.
               88  EXC-SEV-FATAL           VALUE 'F'.
           05  EXC-FILLER                  PIC X(24).
