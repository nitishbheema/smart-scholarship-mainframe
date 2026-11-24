      *****************************************************************
      * PROGRAM:     DB2AUD01                                         *
      * SYSTEM:      SMART SCHOLARSHIP ELIGIBILITY & DISBURSEMENT     *
      * MODULE:      DB2 BATCH AUDIT & RESULT PERSISTENCE SERVICE     *
      * AUTHOR:      MAINFRAME ARCHITECT & COBOL SPECIALIST           *
      * ENVIRONMENT: IBM ENTERPRISE COBOL FOR z/OS WITH EMBEDDED DB2  *
      * PURPOSE:     PERSIST BATCH EXECUTION RUN TOTALS AND AUDIT     *
      *              METRICS INTO DB2 RELATIONAL PROCESSING_AUDIT     *
      *****************************************************************
       IDENTIFICATION DIVISION.
       PROGRAM-ID. DB2AUD01.
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
      * --- DB2 SQL COMMUNICATIONS AREA ---
           EXEC SQL INCLUDE SQLCA END-EXEC.

      * --- DB2 DCLGEN DECLARATIONS ---
       COPY DCLSCH.

       01  WS-PROGRAM-CONSTANTS.
           05  WS-PGM-NAME             PIC X(08) VALUE 'DB2AUD01'.

       LINKAGE SECTION.
       01  LS-AUDIT-INPUT-PARAMS.
           05  LS-BATCH-ID             PIC X(10).
           05  LS-JOB-NAME             PIC X(08).
           05  LS-RECS-READ            PIC 9(08).
           05  LS-RECS-VALID           PIC 9(08).
           05  LS-RECS-ELIG            PIC 9(08).
           05  LS-RECS-REJ             PIC 9(08).
           05  LS-RECS-DUP             PIC 9(08).
           05  LS-TOTAL-AMOUNT         PIC 9(10)V99.
           05  LS-RETURN-CODE          PIC 9(04).
           05  LS-START-TIMESTAMP      PIC X(26).
           05  LS-END-TIMESTAMP        PIC X(26).

       01  LS-DB2-RETURN-STATUS.
           05  LS-SQLCODE              PIC S9(09).
           05  LS-SQLSTATE             PIC X(05).
           05  LS-STATUS-MSG           PIC X(50).

       PROCEDURE DIVISION USING LS-AUDIT-INPUT-PARAMS
                                LS-DB2-RETURN-STATUS.

       0000-MAIN-PERSISTENCE.
           INITIALIZE LS-DB2-RETURN-STATUS

      *    TRANSFER LINKAGE PARAMETERS TO DB2 HOST VARIABLES
           MOVE LS-BATCH-ID        TO H-AUD-BATCH-ID
           MOVE LS-JOB-NAME        TO H-AUD-JOB-NAME
           MOVE LS-RECS-READ       TO H-AUD-RECS-READ
           MOVE LS-RECS-VALID      TO H-AUD-RECS-VALID
           MOVE LS-RECS-ELIG       TO H-AUD-RECS-ELIG
           MOVE LS-RECS-REJ        TO H-AUD-RECS-REJ
           MOVE LS-RECS-DUP        TO H-AUD-RECS-DUP
           MOVE LS-TOTAL-AMOUNT    TO H-AUD-TOTAL-AMOUNT
           MOVE LS-RETURN-CODE     TO H-AUD-RETURN-CODE
           MOVE LS-START-TIMESTAMP TO H-AUD-START-TS
           MOVE LS-END-TIMESTAMP   TO H-AUD-END-TS

      *    EXECUTE DB2 INSERT INTO AUDIT TABLE
           EXEC SQL
               INSERT INTO PROCESSING_AUDIT
               (
                   BATCH_ID,
                   JOB_NAME,
                   RECS_READ,
                   RECS_VALID,
                   RECS_ELIGIBLE,
                   RECS_REJECTED,
                   RECS_DUPLICATE,
                   TOTAL_DISBURSED_AMT,
                   RETURN_CODE,
                   START_TS,
                   END_TS,
                   EXECUTED_BY
               )
               VALUES
               (
                   :H-AUD-BATCH-ID,
                   :H-AUD-JOB-NAME,
                   :H-AUD-RECS-READ,
                   :H-AUD-RECS-VALID,
                   :H-AUD-RECS-ELIG,
                   :H-AUD-RECS-REJ,
                   :H-AUD-RECS-DUP,
                   :H-AUD-TOTAL-AMOUNT,
                   :H-AUD-RETURN-CODE,
                   CURRENT TIMESTAMP,
                   CURRENT TIMESTAMP,
                   'ZOSBATCH'
               )
           END-EXEC

           MOVE SQLCODE  TO LS-SQLCODE
           MOVE SQLSTATE TO LS-SQLSTATE

           IF SQLCODE = 0
               EXEC SQL COMMIT END-EXEC
               MOVE 'AUDIT RECORD INSERTED SUCCESSFULLY'
                 TO LS-STATUS-MSG
           ELSE
               EXEC SQL ROLLBACK END-EXEC
               MOVE 'DB2 SQL INSERT FAILED - ROLLED BACK'
                 TO LS-STATUS-MSG
           END-IF

           GOBACK.
