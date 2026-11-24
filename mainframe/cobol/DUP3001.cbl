      *****************************************************************
      * PROGRAM:     DUP3001                                          *
      * SYSTEM:      SMART SCHOLARSHIP ELIGIBILITY & DISBURSEMENT     *
      * MODULE:      DUPLICATE APPLICATION & STUDENT ID DETECTOR      *
      * AUTHOR:      MAINFRAME ARCHITECT & COBOL SPECIALIST           *
      * ENVIRONMENT: IBM ENTERPRISE COBOL FOR z/OS                    *
      * PURPOSE:     MAINTAIN BATCH HASH TABLE / SEEN ENTRIES TO      *
      *              INTERCEPT DUPLICATE SUBMISSIONS IN BATCH STREAM  *
      *****************************************************************
       IDENTIFICATION DIVISION.
       PROGRAM-ID. DUP3001.
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
           05  WS-PGM-NAME             PIC X(08) VALUE 'DUP3001 '.
           05  WS-MAX-TRACKED-ENTRIES  PIC 9(04) VALUE 500.

      * --- IN-FLIGHT BATCH HISTORY TRACKING TABLE ---
       01  WS-SEEN-ENTRIES-AREA.
           05  WS-SEEN-COUNT           PIC 9(04) VALUE 0.
           05  WS-SEEN-TABLE OCCURS 500 TIMES
               INDEXED BY SEEN-IDX.
               10  WS-SEEN-APP-ID      PIC X(10).
               10  WS-SEEN-STU-ID      PIC X(10).
               10  WS-SEEN-SCH-CODE    PIC X(06).

       LINKAGE SECTION.
      * --- INCOMING APPLICATION RECORD ---
       COPY SCHAPP.

      * --- DUPLICATE CHECK COMMUNICATION AREA ---
       01  LS-DUP-COMM-AREA.
           05  LS-DUP-RETURN-CODE      PIC 9(04).
               88  LS-DUP-RC-CLEAN     VALUE 0000.
               88  LS-DUP-RC-DUP-APP   VALUE 0008.
               88  LS-DUP-RC-DUP-STU   VALUE 0012.
               88  LS-DUP-RC-TBL-OVF   VALUE 0016.
           05  LS-DUP-REASON-MSG       PIC X(45).
           05  LS-DUP-ORIG-APP-ID      PIC X(10).

       PROCEDURE DIVISION USING SCHOLARSHIP-APP-RECORD
                                LS-DUP-COMM-AREA.

       0000-MAIN-CHECK.
           INITIALIZE LS-DUP-COMM-AREA
           SET LS-DUP-RC-CLEAN TO TRUE
           MOVE SPACES TO LS-DUP-REASON-MSG
           MOVE SPACES TO LS-DUP-ORIG-APP-ID

           IF WS-SEEN-COUNT > 0
               PERFORM 1000-SEARCH-SEEN-TABLE
           END-IF

           IF LS-DUP-RC-CLEAN
               PERFORM 2000-REGISTER-ENTRY
           END-IF

           GOBACK.

       1000-SEARCH-SEEN-TABLE.
           PERFORM VARYING SEEN-IDX FROM 1 BY 1
             UNTIL SEEN-IDX > WS-SEEN-COUNT
      *        CHECK 1: EXACT DUPLICATE APPLICATION ID
               IF WS-SEEN-APP-ID(SEEN-IDX) = APP-ID
                   SET LS-DUP-RC-DUP-APP TO TRUE
                   MOVE 'DUPLICATE APPLICATION ID DETECTED IN BATCH'
                     TO LS-DUP-REASON-MSG
                   MOVE WS-SEEN-APP-ID(SEEN-IDX) TO LS-DUP-ORIG-APP-ID
                   EXIT PERFORM
               END-IF

      *        CHECK 2: DUPLICATE STUDENT ID APPLYING IN SAME SCHEME
               IF WS-SEEN-STU-ID(SEEN-IDX) = APP-STU-ID AND
                  WS-SEEN-SCH-CODE(SEEN-IDX) = APP-SCH-CODE
                   SET LS-DUP-RC-DUP-STU TO TRUE
                   MOVE 'STUDENT ALREADY APPLIED FOR SCHOLARSHIP'
                     TO LS-DUP-REASON-MSG
                   MOVE WS-SEEN-APP-ID(SEEN-IDX) TO LS-DUP-ORIG-APP-ID
                   EXIT PERFORM
               END-IF
           END-PERFORM.

       2000-REGISTER-ENTRY.
           IF WS-SEEN-COUNT < WS-MAX-TRACKED-ENTRIES
               ADD 1 TO WS-SEEN-COUNT
               MOVE APP-ID       TO WS-SEEN-APP-ID(WS-SEEN-COUNT)
               MOVE APP-STU-ID   TO WS-SEEN-STU-ID(WS-SEEN-COUNT)
               MOVE APP-SCH-CODE TO WS-SEEN-SCH-CODE(WS-SEEN-COUNT)
           ELSE
               SET LS-DUP-RC-TBL-OVF TO TRUE
               MOVE 'DUPLICATE TRACKING INTERNAL TABLE FULL'
                 TO LS-DUP-REASON-MSG
           END-IF.
