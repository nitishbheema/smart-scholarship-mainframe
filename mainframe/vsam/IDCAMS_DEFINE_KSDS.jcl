//IDCKSDS0 JOB (SCHOLAR,BAT),'IDCAMS DEFINE KSDS',
//             CLASS=A,MSGCLASS=X,NOTIFY=&SYSUID
//*-------------------------------------------------------------------*
//* JCL: IDCAMS_DEFINE_KSDS.JCL                                       *
//* PURPOSE: DEFINE VSAM KSDS CLUSTER FOR STUDENT MASTER RECORDS      *
//*          AND LOAD INITIAL DATA USING IDCAMS REPRO                 *
//* RECORD SIZE: 150 BYTES FIXED                                      *
//* KEY: STU-ID (LENGTH: 10 BYTES, OFFSET: 0)                         *
//*-------------------------------------------------------------------*
//STEP010  EXEC PGM=IDCAMS
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
  /* DELETE CLUSTER IF ALREADY EXISTS TO PREVENT DEFINE CONFLICT */
  DELETE USERID.SCHOLAR.VSAM.STUMAST.KSDS CLUSTER PURGE -
         ERASE

  SET MAXCC = 0

  /* DEFINE VSAM KEY SEQUENCED DATA SET (KSDS) CLUSTER */
  DEFINE CLUSTER -
         (NAME(USERID.SCHOLAR.VSAM.STUMAST.KSDS) -
          INDEXED                                -
          KEYS(10 0)                             -
          RECORDSIZE(150 150)                    -
          FREESPACE(15 10)                       -
          SHAREOPTIONS(2 3)                      -
          SPEED                                  -
          CYLINDERS(5 2)                         -
          VOLUME(VOL001))                        -
    DATA -
         (NAME(USERID.SCHOLAR.VSAM.STUMAST.KSDS.DATA) -
          CONTROLINTERVALSIZE(4096))             -
    INDEX -
         (NAME(USERID.SCHOLAR.VSAM.STUMAST.KSDS.INDEX) -
          CONTROLINTERVALSIZE(1024))
/*
//*-------------------------------------------------------------------*
//* STEP 2: LOAD SEQUENTIAL STUDENT DATASET INTO NEW VSAM KSDS        *
//*-------------------------------------------------------------------*
//STEP020  EXEC PGM=IDCAMS,COND=(0,NE,STEP010)
//SYSPRINT DD SYSOUT=*
//INSEQ    DD DSN=USERID.SCHOLAR.DATA.STUMAST.SEQ,DISP=SHR
//SYSIN    DD *
  REPRO -
    INFILE(INSEQ) -
    OUTDATASET(USERID.SCHOLAR.VSAM.STUMAST.KSDS)
/*
//*-------------------------------------------------------------------*
//* STEP 3: VERIFY AND PRINT LOADED VSAM KSDS RECORDS                 *
//*-------------------------------------------------------------------*
//STEP030  EXEC PGM=IDCAMS,COND=(0,NE,STEP020)
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
  VERIFY DATASET(USERID.SCHOLAR.VSAM.STUMAST.KSDS)
  PRINT  INDATASET(USERID.SCHOLAR.VSAM.STUMAST.KSDS) -
         CHARACTER -
         COUNT(10)
/*
