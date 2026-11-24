      *****************************************************************
      * COPYBOOK: WSCONST.CPY                                         *
      * DESCRIPTION: CONFIGURABLE SCHOLARSHIP RULES & AMOUNT SLABS    *
      * CAN BE POPULATED FROM PARMLIB/CONFIG DATASET OR COMPILED DFLTS*
      *****************************************************************
       01  WS-SCHOLARSHIP-CONFIG.
      *    --- ACADEMIC & FINANCIAL ELIGIBILITY THRESHOLDS ---
           05  CFG-MIN-CGPA                PIC 9(02)V99 VALUE 07.50.
           05  CFG-MIN-ATTENDANCE          PIC 9(03)V99 VALUE 075.00.
           05  CFG-MAX-ANNUAL-INCOME       PIC 9(08)V99 VALUE 00250000.00.
           05  CFG-MAX-ALLOWED-ARREARS     PIC 9(02)    VALUE 00.

      *    --- AMOUNT SLAB DEFINITIONS (CONFIGURABLE TABLE) ---
           05  CFG-SLAB-COUNT              PIC 9(02)    VALUE 03.
           05  CFG-SLAB-TABLE.
               10  CFG-SLAB-ENTRY OCCURS 3 TIMES
                   INDEXED BY SLAB-IDX.
                   15  CFG-SLAB-MIN-CGPA   PIC 9(02)V99.
                   15  CFG-SLAB-MAX-CGPA   PIC 9(02)V99.
                   15  CFG-SLAB-AMOUNT     PIC 9(07)V99.
                   15  CFG-SLAB-DESC       PIC X(20).

      *    --- DEFAULT SLAB INITIALIZERS (USED IN WORKING-STORAGE) ---
           05  CFG-SLAB-1-MIN-CGPA         PIC 9(02)V99 VALUE 09.00.
           05  CFG-SLAB-1-MAX-CGPA         PIC 9(02)V99 VALUE 10.00.
           05  CFG-SLAB-1-AMOUNT           PIC 9(07)V99 VALUE 0020000.00.
           05  CFG-SLAB-1-DESC             PIC X(20)    VALUE 'HIGH MERIT TIER 1   '.

           05  CFG-SLAB-2-MIN-CGPA         PIC 9(02)V99 VALUE 08.00.
           05  CFG-SLAB-2-MAX-CGPA         PIC 9(02)V99 VALUE 08.99.
           05  CFG-SLAB-2-AMOUNT           PIC 9(07)V99 VALUE 0015000.00.
           05  CFG-SLAB-2-DESC             PIC X(20)    VALUE 'MERIT TIER 2        '.

           05  CFG-SLAB-3-MIN-CGPA         PIC 9(02)V99 VALUE 07.50.
           05  CFG-SLAB-3-MAX-CGPA         PIC 9(02)V99 VALUE 07.99.
           05  CFG-SLAB-3-AMOUNT           PIC 9(07)V99 VALUE 0010000.00.
           05  CFG-SLAB-3-DESC             PIC X(20)    VALUE 'MERIT TIER 3        '.

      *    --- STATUS & RETURN CODES ---
           05  WS-RC-OK                    PIC 9(04)    VALUE 0000.
           05  WS-RC-WARNING               PIC 9(04)    VALUE 0004.
           05  WS-RC-ERROR                 PIC 9(04)    VALUE 0008.
           05  WS-RC-SEVERE                PIC 9(04)    VALUE 0012.
           05  WS-RC-FATAL                 PIC 9(04)    VALUE 0016.
