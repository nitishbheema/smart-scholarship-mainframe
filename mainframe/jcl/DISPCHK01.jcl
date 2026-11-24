//DISPCHK1 JOB (SCHOLAR,BAT),'DISBURSEMENT VERIFY',
//             CLASS=A,MSGCLASS=X,NOTIFY=&SYSUID
//*-------------------------------------------------------------------*
//* JCL: DISPCHK01.JCL                                                *
//* PURPOSE: RECONCILE AND VERIFY GENERATED DISBURSEMENT FILE         *
//*          CHECKS HASH TOTALS, COUNTS, AND DETECTS ANOMALIES        *
//*-------------------------------------------------------------------*
//STEP010  EXEC PGM=SORT
//SYSOUT   DD SYSOUT=*
//SORTIN   DD DSN=USERID.SCHOLAR.DATA.DISB.PAYMENTS,DISP=SHR
//SORTOUT  DD DSN=USERID.SCHOLAR.DATA.DISB.VALIDATED,
//            DISP=(NEW,CATLG,DELETE),
//            SPACE=(TRK,(5,2)),
//            DCB=(RECFM=FB,LRECL=120,BLKSIZE=27960),
//            UNIT=SYSDA
//SYSIN    DD *
* VERIFY DISBURSEMENT RECORD TYPE D (DETAIL RECORDS)
  INCLUDE COND=(1,1,CH,EQ,C'D')
  SORT FIELDS=(2,12,CH,A)
/*
//*
//STEP020  EXEC PGM=IDCAMS,COND=(0,NE,STEP010)
//SYSPRINT DD SYSOUT=*
//SYSIN    DD *
  PRINT INDATASET(USERID.SCHOLAR.DATA.DISB.VALIDATED) -
        CHARACTER                                     -
        COUNT(50)
/*
