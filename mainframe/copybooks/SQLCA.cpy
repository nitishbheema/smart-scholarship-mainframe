      *****************************************************************
      * COPYBOOK: SQLCA.CPY                                           *
      * DESCRIPTION: IBM DB2 SQL COMMUNICATIONS AREA (STANDARD z/OS) *
      *****************************************************************
       01  SQLCA.
           05  SQLCAID                     PIC X(08) VALUE 'SQLCA   '.
           05  SQLCABC                     PIC S9(09) COMP-4 VALUE 136.
           05  SQLCODE                     PIC S9(09) COMP-4 VALUE 0.
           05  SQLERRM.
               49  SQLERRML                PIC S9(04) COMP-4 VALUE 0.
               49  SQLERRMC                PIC X(70)  VALUE SPACES.
           05  SQLERRP                     PIC X(08) VALUE SPACES.
           05  SQLERRD OCCURS 6 TIMES      PIC S9(09) COMP-4 VALUE 0.
           05  SQLWARN.
               10  SQLWARN0                PIC X(01) VALUE SPACES.
               10  SQLWARN1                PIC X(01) VALUE SPACES.
               10  SQLWARN2                PIC X(01) VALUE SPACES.
               10  SQLWARN3                PIC X(01) VALUE SPACES.
               10  SQLWARN4                PIC X(01) VALUE SPACES.
               10  SQLWARN5                PIC X(01) VALUE SPACES.
               10  SQLWARN6                PIC X(01) VALUE SPACES.
               10  SQLWARN7                PIC X(01) VALUE SPACES.
           05  SQLEXT.
               10  SQLWARN8                PIC X(01) VALUE SPACES.
               10  SQLWARN9                PIC X(01) VALUE SPACES.
               10  SQLWARNA                PIC X(01) VALUE SPACES.
               10  SQLSTATE                PIC X(05) VALUE '00000'.
