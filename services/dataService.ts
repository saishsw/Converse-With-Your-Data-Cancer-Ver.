import { DataRow, QueryResult } from '../types';

export const SAMPLE_CSV_CONTENT = `case_id,biomarkerName,gene,therapyName,diagnosis_UAHS,primary_Tumor_Organ
1,ERBB2 (Her2/Neu),ERBB2,"lapatinib, pertuzumab, trastuzumab",Mucinous adenocarcinoma,appendix
1,KRAS,KRAS,"cetuximab, panitumumab",Mucinous adenocarcinoma,appendix
1,KRAS,KRAS,"lapatinib, pertuzumab, trastuzumab",Mucinous adenocarcinoma,appendix
2,BRAF,BRAF,"cetuximab,panitumumab",Adenocarcinoma,colon
2,KRAS,KRAS,"cetuximab,panitumumab",Adenocarcinoma,colon
2,NRAS,NRAS,"cetuximab,panitumumab",Adenocarcinoma,colon
2,PIK3CA,PIK3CA,aspirin,Adenocarcinoma,colon
2,PIK3CA,PIK3CA,"cetuximab,panitumumab",Adenocarcinoma,colon
2,PTEN,PTEN,"cetuximab,panitumumab",Adenocarcinoma,colon
3,KRAS,KRAS,"cetuximab, panitumumab",Adenocarcinoma,colon
5,PD-L1 (22c3),CD274,pembrolizumab,Squamous cell carcinoma,tonsils
6,ERBB2 (Her2/Neu),ERBB2,"lapatinib, pertuzumab, trastuzumab",Adenocarcinoma,rectum
6,NRAS,NRAS,"cetuximab, panitumumab",Adenocarcinoma,rectum
7,ER,ESR1,endocrine therapy,Low-grade serous carcinoma,ovaries
7,FOLR1,FOLR1,mirvetuximab soravtansine,Low-grade serous carcinoma,ovaries
7,PD-L1 (22c3),CD274,pembrolizumab,Low-grade serous carcinoma,ovaries
8,PD-L1 (22c3),CD274,pembrolizumab,High-grade serous carcinoma,peritoneum
9,BRAF,BRAF,"binimetinib, cobimetinib, dabrafenib, encorafenib, trametinib, vemurafenib",Nodular melanoma,skin
10,PD-L1 (SP142),CD274,nivolumab,Squamous cell carcinoma,penis
10,PD-L1 (SP142),CD274,pembrolizumab,Squamous cell carcinoma,penis
11,BRAF,BRAF,"dabrafenib, encorafenib, vemurafenib",Melanoma,skin
12,AR,AR,"bicalutamide, enzalutamide",Ductal carcinoma,breast
12,BRCA1,BRCA1,"carboplatin, cisplatin",Ductal carcinoma,breast
12,BRCA1,BRCA1,"olaparib, talazoparib",Ductal carcinoma,breast
12,ER,ESR1,endocrine therapy,Ductal carcinoma,breast
12,ER/PR/Her2/Neu,ERBB2,sacituzumab govitecan,Ductal carcinoma,breast
12,ER/PR/Her2/Neu,ESR1,sacituzumab govitecan,Ductal carcinoma,breast
12,ER/PR/Her2/Neu,PGR,sacituzumab govitecan,Ductal carcinoma,breast
12,ERBB2 (Her2/Neu),ERBB2,"pertuzumab, margetuximab fam-trastuzumab deruxtecan-nxki lapatinib, neratinib, tucatinib",Ductal carcinoma,breast
12,ERBB2 (Her2/Neu),ERBB2,"trastuzumab ado-trastuzumab emtansine (T-DM1)",Ductal carcinoma,breast
12,PR,PGR,endocrine therapy,Ductal carcinoma,breast
13,Mismatch Repair Status,MLH1,"dostarlimab, pembrolizumab",Brenner tumor,ovaries
13,Mismatch Repair Status,MSH2,"dostarlimab, pembrolizumab",Brenner tumor,ovaries
13,Mismatch Repair Status,MSH6,"dostarlimab, pembrolizumab",Brenner tumor,ovaries
13,Mismatch Repair Status,PMS2,"dostarlimab, pembrolizumab",Brenner tumor,ovaries
14,ERBB2 (Her2/Neu),ERBB2,"trastuzumab + chemotherapy",Serous carcinoma,uterus
14,Mismatch Repair Status,MLH1,"pembrolizumab + lenvatinib",Serous carcinoma,uterus
14,Mismatch Repair Status,MSH2,"pembrolizumab + lenvatinib",Serous carcinoma,uterus
14,Mismatch Repair Status,MSH6,"pembrolizumab + lenvatinib",Serous carcinoma,uterus
14,Mismatch Repair Status,PMS2,"pembrolizumab + lenvatinib",Serous carcinoma,uterus`;

export const parseCSV = (file: File): Promise<DataRow[]> => {
  return new Promise((resolve, reject) => {
    if (!window.Papa) {
      reject(new Error('PapaParse library not loaded'));
      return;
    }

    window.Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        if (results.data && results.data.length > 0) {
          resolve(results.data);
        } else {
          reject(new Error('No data found in CSV'));
        }
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
};

export const validateSQL = (sql: string): { valid: boolean; error?: string } => {
  if (!window.alasql) {
    return { valid: true }; // Assume valid if engine not loaded yet (will fail at exec)
  }
  try {
    window.alasql.parse(sql);
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Syntax error' };
  }
};

export const executeSQL = (sql: string, data: DataRow[]): QueryResult => {
  if (!window.alasql) {
    return { data: [], error: 'AlaSQL library not loaded' };
  }

  const startTime = performance.now();
  try {
    // Create an in-memory database context for this execution
    // We register the data as a table named 'csv_data'
    // Note: alasql can query arrays directly via ? placeholder or standard param injection
    // To allow natural table naming "FROM csv_data", we can do:
    const res = window.alasql(sql, [data]);
    const endTime = performance.now();
    
    return {
      data: res,
      executionTimeMs: endTime - startTime
    };
  } catch (err: any) {
    return {
      data: [],
      error: err.message || 'Unknown SQL execution error'
    };
  }
};

export const downloadCSV = (data: DataRow[], filename: string) => {
  if (!window.Papa) return;
  
  const csv = window.Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};