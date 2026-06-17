"""
基金监管天眼 - Mock 数据生成脚本
生成 200 条南京市市区就诊取药记录，含 140 条正常记录 + 60 条异常记录
"""

import json
import random
from datetime import datetime, timedelta
from collections import defaultdict

# 设置随机种子，保证可复现
random.seed(42)

# ==================== 基础数据配置 ====================

DISTRICTS = ["鼓楼区", "玄武区", "秦淮区", "建邺区", "雨花台区", "栖霞区", "江宁区"]

HOSPITALS = [
    {"id": "H001", "name": "南京鼓楼医院", "level": "三级甲等", "district": "鼓楼区"},
    {"id": "H002", "name": "江苏省人民医院", "level": "三级甲等", "district": "鼓楼区"},
    {"id": "H003", "name": "南京市第一医院", "level": "三级甲等", "district": "秦淮区"},
    {"id": "H004", "name": "东南大学附属中大医院", "level": "三级甲等", "district": "鼓楼区"},
    {"id": "H005", "name": "南京市中医院", "level": "三级甲等", "district": "秦淮区"},
    {"id": "H006", "name": "南京医科大学第二附属医院", "level": "三级甲等", "district": "鼓楼区"},
    {"id": "H007", "name": "江宁医院", "level": "三级乙等", "district": "江宁区"},
    {"id": "H008", "name": "南京市栖霞区医院", "level": "二级甲等", "district": "栖霞区"},
    {"id": "H009", "name": "南京市雨花台区中心医院", "level": "二级甲等", "district": "雨花台区"},
    {"id": "H010", "name": "南京市建邺医院", "level": "二级甲等", "district": "建邺区"},
]

DEPARTMENTS = ["心内科", "内分泌科", "呼吸科", "消化科", "神经内科", "骨科", "普外科"]

DOCTORS = [f"D{str(i).zfill(3)}" for i in range(1, 31)]
DOCTOR_NAMES = [
    "王医生", "李医生", "张医生", "刘医生", "陈医生",
    "杨医生", "黄医生", "赵医生", "周医生", "吴医生",
    "徐医生", "孙医生", "马医生", "朱医生", "胡医生",
    "郭医生", "何医生", "高医生", "林医生", "罗医生",
    "郑医生", "梁医生", "谢医生", "宋医生", "唐医生",
    "许医生", "韩医生", "冯医生", "邓医生", "曹医生",
]

# 药品配置：名称、类别、单价范围、日剂量标准、是否医保、是否集采
DRUGS = [
    {"name": "氨氯地平片", "category": "降压药", "priceRange": (2.0, 4.0), "dailyDose": 1, "insurance": True, "procurement": True},
    {"name": "硝苯地平控释片", "category": "降压药", "priceRange": (3.0, 5.0), "dailyDose": 1, "insurance": True, "procurement": True},
    {"name": "缬沙坦胶囊", "category": "降压药", "priceRange": (2.5, 4.5), "dailyDose": 1, "insurance": True, "procurement": True},
    {"name": "阿托伐他汀钙片", "category": "降脂药", "priceRange": (3.0, 6.0), "dailyDose": 1, "insurance": True, "procurement": True},
    {"name": "二甲双胍片", "category": "降糖药", "priceRange": (1.5, 3.0), "dailyDose": 2, "insurance": True, "procurement": True},
    {"name": "阿司匹林肠溶片", "category": "抗血小板药", "priceRange": (1.0, 2.5), "dailyDose": 1, "insurance": True, "procurement": True},
    {"name": "头孢克肟胶囊", "category": "抗生素", "priceRange": (8.0, 15.0), "dailyDose": 2, "insurance": True, "procurement": False},
    {"name": "阿莫西林胶囊", "category": "抗生素", "priceRange": (5.0, 10.0), "dailyDose": 3, "insurance": True, "procurement": True},
    {"name": "奥美拉唑肠溶胶囊", "category": "抑酸药", "priceRange": (4.0, 8.0), "dailyDose": 1, "insurance": True, "procurement": True},
    {"name": "布洛芬缓释胶囊", "category": "解热镇痛药", "priceRange": (3.0, 6.0), "dailyDose": 2, "insurance": True, "procurement": False},
]

# 诊断与合理药品类别的映射
DIAGNOSIS_DRUG_MAP = {
    "高血压": ["降压药"],
    "糖尿病": ["降糖药"],
    "冠心病": ["抗血小板药", "降脂药"],
    "高脂血症": ["降脂药"],
    "脑梗死后遗症": ["抗血小板药", "降脂药"],
    "上呼吸道感染": ["抗生素", "解热镇痛药"],
    "急性支气管炎": ["抗生素", "解热镇痛药"],
    "胃炎": ["抑酸药"],
    "胃溃疡": ["抑酸药"],
    "关节炎": ["解热镇痛药"],
}

DIAGNOSES = list(DIAGNOSIS_DRUG_MAP.keys())
ICD10_CODES = {
    "高血压": "I10",
    "糖尿病": "E11",
    "冠心病": "I25",
    "高脂血症": "E78",
    "脑梗死后遗症": "I69",
    "上呼吸道感染": "J06",
    "急性支气管炎": "J20",
    "胃炎": "K29",
    "胃溃疡": "K25",
    "关节炎": "M13",
}

GENDERS = ["男", "女"]
INSURANCE_TYPES = ["职工医保", "居民医保"]
VISIT_TYPES = ["门诊", "住院", "急诊"]
PRESCRIPTION_TYPES = ["院内", "外配"]

# 患者池
PATIENTS = [f"P{str(i).zfill(3)}" for i in range(1, 101)]

# ==================== 辅助函数 ====================

def random_time_in_last_30_days(base_date=None):
    """生成过去 30 天内的随机时间"""
    if base_date is None:
        base_date = datetime(2026, 6, 16)
    days_ago = random.randint(0, 30)
    hours = random.randint(8, 20)
    minutes = random.randint(0, 59)
    return base_date - timedelta(days=days_ago, hours=24-hours, minutes=minutes)


def generate_trace_code():
    """生成药品追溯码"""
    return "".join([str(random.randint(0, 9)) for _ in range(13)])


def select_drug_for_diagnosis(diagnosis, abnormal_type=None):
    """根据诊断选择合理药品，可选生成超适应症异常"""
    if abnormal_type == "over_indication":
        # 随机选一个与诊断不匹配的药品类别
        wrong_categories = [d["category"] for d in DRUGS if d["category"] not in DIAGNOSIS_DRUG_MAP[diagnosis]]
        category = random.choice(wrong_categories)
    else:
        category = random.choice(DIAGNOSIS_DRUG_MAP[diagnosis])
    
    drugs_in_category = [d for d in DRUGS if d["category"] == category]
    return random.choice(drugs_in_category)


def generate_normal_record(record_id, patient_pool, used_trace_codes):
    """生成一条正常就诊记录"""
    patient_id = random.choice(patient_pool)
    hospital = random.choice(HOSPITALS)
    doctor_idx = random.randint(0, len(DOCTORS) - 1)
    doctor_id = DOCTORS[doctor_idx]
    doctor_name = DOCTOR_NAMES[doctor_idx]
    department = random.choice(DEPARTMENTS)
    diagnosis = random.choice(DIAGNOSES)
    
    # 根据诊断选药品
    drug = select_drug_for_diagnosis(diagnosis)
    
    # 正常处方：30 天左右，不超量
    duration = random.choice([7, 14, 30])
    quantity = drug["dailyDose"] * duration
    unit_price = round(random.uniform(*drug["priceRange"]), 2)
    drug_amount = round(quantity * unit_price, 2)
    
    # 总费用 = 药品费 + 检查/诊疗费
    other_fee = round(random.uniform(20, 200), 2)
    total_amount = round(drug_amount + other_fee, 2)
    insurance_pay = round(total_amount * random.uniform(0.6, 0.85), 2)
    self_pay = round(total_amount - insurance_pay, 2)
    
    visit_type = random.choice(["门诊", "门诊", "门诊", "急诊"])  # 正常以门诊为主
    
    trace_code = generate_trace_code()
    used_trace_codes[trace_code].append(patient_id)
    
    return {
        "recordId": f"R{record_id:08d}",
        "patientId": patient_id,
        "name": f"{random.choice('赵钱孙李周吴郑王')}**",
        "gender": random.choice(GENDERS),
        "age": random.randint(25, 75),
        "insuranceType": random.choice(INSURANCE_TYPES),
        "insuredCity": "南京市",
        "visitTime": random_time_in_last_30_days().strftime("%Y-%m-%d %H:%M"),
        "hospitalId": hospital["id"],
        "hospitalName": hospital["name"],
        "hospitalLevel": hospital["level"],
        "department": department,
        "doctorId": doctor_id,
        "doctorName": doctor_name,
        "visitType": visit_type,
        "diagnosis": diagnosis,
        "icd10Code": ICD10_CODES[diagnosis],
        "isChronic": diagnosis in ["高血压", "糖尿病", "冠心病", "高脂血症", "脑梗死后遗症"],
        "severity": random.choice(["普通", "普通", "普通", "较重"]),
        "drugName": drug["name"],
        "drugCode": f"YP{DRUGS.index(drug)+1:03d}",
        "drugCategory": drug["category"],
        "isInsuranceCovered": drug["insurance"],
        "isCentralizedProcurement": drug["procurement"],
        "dailyDose": drug["dailyDose"],
        "duration": duration,
        "quantity": quantity,
        "unitPrice": unit_price,
        "drugAmount": drug_amount,
        "traceCode": trace_code,
        "prescriptionType": random.choice(PRESCRIPTION_TYPES),
        "totalAmount": total_amount,
        "insurancePay": insurance_pay,
        "selfPay": self_pay,
        "visitCount7Days": random.randint(0, 2),
        "sameDrugCount30Days": random.randint(0, 2),
        "crossHospitalCount": random.randint(0, 2),
        "isOverDose": False,
        "isOverIndication": False,
        "isDuplicatePrescription": False,
        "city": "南京市",
        "district": hospital["district"],
        "abnormalType": None,
    }


def generate_frequent_visit_records(start_id, count, patient_pool, used_trace_codes):
    """生成频繁就医异常记录：同一患者 7 天内多次就诊"""
    records = []
    for _ in range(count):
        patient_id = random.choice(patient_pool)
        base_time = random_time_in_last_30_days()
        hospital = random.choice(HOSPITALS)
        doctor_idx = random.randint(0, len(DOCTORS) - 1)
        diagnosis = random.choice(DIAGNOSES)
        drug = select_drug_for_diagnosis(diagnosis)
        
        # 7 天内就诊 7-12 次
        num_visits = random.randint(7, 12)
        for i in range(num_visits):
            visit_time = base_time + timedelta(days=i, hours=random.randint(8, 20))
            duration = random.choice([3, 7])
            quantity = drug["dailyDose"] * duration
            unit_price = round(random.uniform(*drug["priceRange"]), 2)
            drug_amount = round(quantity * unit_price, 2)
            other_fee = round(random.uniform(20, 100), 2)
            total_amount = round(drug_amount + other_fee, 2)
            insurance_pay = round(total_amount * random.uniform(0.6, 0.85), 2)
            
            trace_code = generate_trace_code()
            used_trace_codes[trace_code].append(patient_id)
            
            records.append({
                "recordId": f"R{start_id + len(records):08d}",
                "patientId": patient_id,
                "name": f"{random.choice('赵钱孙李周吴郑王')}**",
                "gender": random.choice(GENDERS),
                "age": random.randint(45, 70),
                "insuranceType": random.choice(INSURANCE_TYPES),
                "insuredCity": "南京市",
                "visitTime": visit_time.strftime("%Y-%m-%d %H:%M"),
                "hospitalId": hospital["id"],
                "hospitalName": hospital["name"],
                "hospitalLevel": hospital["level"],
                "department": random.choice(DEPARTMENTS),
                "doctorId": DOCTORS[doctor_idx],
                "doctorName": DOCTOR_NAMES[doctor_idx],
                "visitType": "门诊",
                "diagnosis": diagnosis,
                "icd10Code": ICD10_CODES[diagnosis],
                "isChronic": diagnosis in ["高血压", "糖尿病", "冠心病", "高脂血症", "脑梗死后遗症"],
                "severity": "普通",
                "drugName": drug["name"],
                "drugCode": f"YP{DRUGS.index(drug)+1:03d}",
                "drugCategory": drug["category"],
                "isInsuranceCovered": drug["insurance"],
                "isCentralizedProcurement": drug["procurement"],
                "dailyDose": drug["dailyDose"],
                "duration": duration,
                "quantity": quantity,
                "unitPrice": unit_price,
                "drugAmount": drug_amount,
                "traceCode": trace_code,
                "prescriptionType": "院内",
                "totalAmount": total_amount,
                "insurancePay": insurance_pay,
                "selfPay": round(total_amount - insurance_pay, 2),
                "visitCount7Days": num_visits,
                "sameDrugCount30Days": random.randint(3, 6),
                "crossHospitalCount": random.randint(0, 1),
                "isOverDose": False,
                "isOverIndication": False,
                "isDuplicatePrescription": False,
                "city": "南京市",
                "district": hospital["district"],
                "abnormalType": "frequent_visit",
            })
    return records


def generate_over_dose_records(start_id, count, patient_pool, used_trace_codes):
    """生成超量开药异常记录"""
    records = []
    for _ in range(count):
        patient_id = random.choice(patient_pool)
        hospital = random.choice(HOSPITALS)
        doctor_idx = random.randint(0, len(DOCTORS) - 1)
        diagnosis = random.choice(["高血压", "糖尿病", "冠心病", "高脂血症"])
        drug = select_drug_for_diagnosis(diagnosis)
        
        duration = random.choice([90, 120, 180])  # 超量：3-6 个月
        quantity = drug["dailyDose"] * duration
        unit_price = round(random.uniform(*drug["priceRange"]), 2)
        drug_amount = round(quantity * unit_price, 2)
        other_fee = round(random.uniform(20, 100), 2)
        total_amount = round(drug_amount + other_fee, 2)
        insurance_pay = round(total_amount * random.uniform(0.6, 0.85), 2)
        
        trace_code = generate_trace_code()
        used_trace_codes[trace_code].append(patient_id)
        
        records.append({
            "recordId": f"R{start_id + len(records):08d}",
            "patientId": patient_id,
            "name": f"{random.choice('赵钱孙李周吴郑王')}**",
            "gender": random.choice(GENDERS),
            "age": random.randint(50, 75),
            "insuranceType": random.choice(INSURANCE_TYPES),
            "insuredCity": "南京市",
            "visitTime": random_time_in_last_30_days().strftime("%Y-%m-%d %H:%M"),
            "hospitalId": hospital["id"],
            "hospitalName": hospital["name"],
            "hospitalLevel": hospital["level"],
            "department": random.choice(DEPARTMENTS),
            "doctorId": DOCTORS[doctor_idx],
            "doctorName": DOCTOR_NAMES[doctor_idx],
            "visitType": "门诊",
            "diagnosis": diagnosis,
            "icd10Code": ICD10_CODES[diagnosis],
            "isChronic": True,
            "severity": "普通",
            "drugName": drug["name"],
            "drugCode": f"YP{DRUGS.index(drug)+1:03d}",
            "drugCategory": drug["category"],
            "isInsuranceCovered": drug["insurance"],
            "isCentralizedProcurement": drug["procurement"],
            "dailyDose": drug["dailyDose"],
            "duration": duration,
            "quantity": quantity,
            "unitPrice": unit_price,
            "drugAmount": drug_amount,
            "traceCode": trace_code,
            "prescriptionType": "院内",
            "totalAmount": total_amount,
            "insurancePay": insurance_pay,
            "selfPay": round(total_amount - insurance_pay, 2),
            "visitCount7Days": random.randint(0, 2),
            "sameDrugCount30Days": random.randint(2, 4),
            "crossHospitalCount": random.randint(0, 1),
            "isOverDose": True,
            "isOverIndication": False,
            "isDuplicatePrescription": False,
            "city": "南京市",
            "district": hospital["district"],
            "abnormalType": "over_dose",
        })
    return records


def generate_cross_hospital_records(start_id, count, patient_pool, used_trace_codes):
    """生成跨院重复开药异常记录"""
    records = []
    for _ in range(count):
        patient_id = random.choice(patient_pool)
        # 选 2-3 家不同医院
        num_hospitals = random.randint(2, 3)
        selected_hospitals = random.sample(HOSPITALS, num_hospitals)
        diagnosis = random.choice(["高血压", "糖尿病", "冠心病"])
        drug = select_drug_for_diagnosis(diagnosis)
        base_time = random_time_in_last_30_days()
        
        for i, hospital in enumerate(selected_hospitals):
            doctor_idx = random.randint(0, len(DOCTORS) - 1)
            visit_time = base_time + timedelta(days=i*2, hours=random.randint(8, 20))
            duration = 30
            quantity = drug["dailyDose"] * duration
            unit_price = round(random.uniform(*drug["priceRange"]), 2)
            drug_amount = round(quantity * unit_price, 2)
            other_fee = round(random.uniform(20, 100), 2)
            total_amount = round(drug_amount + other_fee, 2)
            insurance_pay = round(total_amount * random.uniform(0.6, 0.85), 2)
            
            trace_code = generate_trace_code()
            used_trace_codes[trace_code].append(patient_id)
            
            records.append({
                "recordId": f"R{start_id + len(records):08d}",
                "patientId": patient_id,
                "name": f"{random.choice('赵钱孙李周吴郑王')}**",
                "gender": random.choice(GENDERS),
                "age": random.randint(45, 70),
                "insuranceType": random.choice(INSURANCE_TYPES),
                "insuredCity": "南京市",
                "visitTime": visit_time.strftime("%Y-%m-%d %H:%M"),
                "hospitalId": hospital["id"],
                "hospitalName": hospital["name"],
                "hospitalLevel": hospital["level"],
                "department": random.choice(DEPARTMENTS),
                "doctorId": DOCTORS[doctor_idx],
                "doctorName": DOCTOR_NAMES[doctor_idx],
                "visitType": "门诊",
                "diagnosis": diagnosis,
                "icd10Code": ICD10_CODES[diagnosis],
                "isChronic": True,
                "severity": "普通",
                "drugName": drug["name"],
                "drugCode": f"YP{DRUGS.index(drug)+1:03d}",
                "drugCategory": drug["category"],
                "isInsuranceCovered": drug["insurance"],
                "isCentralizedProcurement": drug["procurement"],
                "dailyDose": drug["dailyDose"],
                "duration": duration,
                "quantity": quantity,
                "unitPrice": unit_price,
                "drugAmount": drug_amount,
                "traceCode": trace_code,
                "prescriptionType": "院内",
                "totalAmount": total_amount,
                "insurancePay": insurance_pay,
                "selfPay": round(total_amount - insurance_pay, 2),
                "visitCount7Days": random.randint(0, 3),
                "sameDrugCount30Days": num_hospitals,
                "crossHospitalCount": num_hospitals,
                "isOverDose": False,
                "isOverIndication": False,
                "isDuplicatePrescription": True,
                "city": "南京市",
                "district": hospital["district"],
                "abnormalType": "cross_hospital",
            })
    return records


def generate_trace_code_abnormal_records(start_id, count, patient_pool, used_trace_codes):
    """生成串换药品异常记录：同一追溯码被多个患者使用"""
    records = []
    for _ in range(count):
        # 生成一个共享追溯码
        shared_trace_code = generate_trace_code()
        # 2-4 个患者共享
        num_patients = random.randint(2, 4)
        shared_patients = random.sample(patient_pool, num_patients)
        diagnosis = random.choice(["高血压", "糖尿病"])
        drug = select_drug_for_diagnosis(diagnosis)
        base_time = random_time_in_last_30_days()
        
        # 固定一家医院/医生，模拟团伙
        hospital = random.choice(HOSPITALS)
        doctor_idx = random.randint(0, len(DOCTORS) - 1)
        
        for i, patient_id in enumerate(shared_patients):
            visit_time = base_time + timedelta(days=i, hours=random.randint(8, 20))
            duration = 30
            quantity = drug["dailyDose"] * duration
            unit_price = round(random.uniform(*drug["priceRange"]), 2)
            drug_amount = round(quantity * unit_price, 2)
            other_fee = round(random.uniform(20, 100), 2)
            total_amount = round(drug_amount + other_fee, 2)
            insurance_pay = round(total_amount * random.uniform(0.6, 0.85), 2)
            
            used_trace_codes[shared_trace_code].append(patient_id)
            
            records.append({
                "recordId": f"R{start_id + len(records):08d}",
                "patientId": patient_id,
                "name": f"{random.choice('赵钱孙李周吴郑王')}**",
                "gender": random.choice(GENDERS),
                "age": random.randint(45, 70),
                "insuranceType": random.choice(INSURANCE_TYPES),
                "insuredCity": "南京市",
                "visitTime": visit_time.strftime("%Y-%m-%d %H:%M"),
                "hospitalId": hospital["id"],
                "hospitalName": hospital["name"],
                "hospitalLevel": hospital["level"],
                "department": random.choice(DEPARTMENTS),
                "doctorId": DOCTORS[doctor_idx],
                "doctorName": DOCTOR_NAMES[doctor_idx],
                "visitType": "门诊",
                "diagnosis": diagnosis,
                "icd10Code": ICD10_CODES[diagnosis],
                "isChronic": True,
                "severity": "普通",
                "drugName": drug["name"],
                "drugCode": f"YP{DRUGS.index(drug)+1:03d}",
                "drugCategory": drug["category"],
                "isInsuranceCovered": drug["insurance"],
                "isCentralizedProcurement": drug["procurement"],
                "dailyDose": drug["dailyDose"],
                "duration": duration,
                "quantity": quantity,
                "unitPrice": unit_price,
                "drugAmount": drug_amount,
                "traceCode": shared_trace_code,  # 共享追溯码！
                "prescriptionType": "院内",
                "totalAmount": total_amount,
                "insurancePay": insurance_pay,
                "selfPay": round(total_amount - insurance_pay, 2),
                "visitCount7Days": random.randint(0, 2),
                "sameDrugCount30Days": random.randint(1, 3),
                "crossHospitalCount": 0,
                "isOverDose": False,
                "isOverIndication": False,
                "isDuplicatePrescription": False,
                "city": "南京市",
                "district": hospital["district"],
                "abnormalType": "trace_code_abnormal",
            })
    return records


def generate_fake_hospitalization_records(start_id, count, patient_pool, used_trace_codes):
    """生成虚假住院/挂床异常记录：住院但费用极低"""
    records = []
    for _ in range(count):
        patient_id = random.choice(patient_pool)
        hospital = random.choice(HOSPITALS)
        doctor_idx = random.randint(0, len(DOCTORS) - 1)
        diagnosis = random.choice(DIAGNOSES)
        drug = select_drug_for_diagnosis(diagnosis)
        
        duration = 7
        quantity = drug["dailyDose"] * duration
        unit_price = round(random.uniform(*drug["priceRange"]), 2)
        drug_amount = round(quantity * unit_price, 2)
        # 住院但费用极低（<500）
        total_amount = round(random.uniform(150, 450), 2)
        insurance_pay = round(total_amount * random.uniform(0.6, 0.85), 2)
        
        trace_code = generate_trace_code()
        used_trace_codes[trace_code].append(patient_id)
        
        records.append({
            "recordId": f"R{start_id + len(records):08d}",
            "patientId": patient_id,
            "name": f"{random.choice('赵钱孙李周吴郑王')}**",
            "gender": random.choice(GENDERS),
            "age": random.randint(40, 75),
            "insuranceType": random.choice(INSURANCE_TYPES),
            "insuredCity": "南京市",
            "visitTime": random_time_in_last_30_days().strftime("%Y-%m-%d %H:%M"),
            "hospitalId": hospital["id"],
            "hospitalName": hospital["name"],
            "hospitalLevel": hospital["level"],
            "department": random.choice(DEPARTMENTS),
            "doctorId": DOCTORS[doctor_idx],
            "doctorName": DOCTOR_NAMES[doctor_idx],
            "visitType": "住院",
            "diagnosis": diagnosis,
            "icd10Code": ICD10_CODES[diagnosis],
            "isChronic": diagnosis in ["高血压", "糖尿病", "冠心病", "高脂血症", "脑梗死后遗症"],
            "severity": "普通",
            "drugName": drug["name"],
            "drugCode": f"YP{DRUGS.index(drug)+1:03d}",
            "drugCategory": drug["category"],
            "isInsuranceCovered": drug["insurance"],
            "isCentralizedProcurement": drug["procurement"],
            "dailyDose": drug["dailyDose"],
            "duration": duration,
            "quantity": quantity,
            "unitPrice": unit_price,
            "drugAmount": drug_amount,
            "traceCode": trace_code,
            "prescriptionType": "院内",
            "totalAmount": total_amount,
            "insurancePay": insurance_pay,
            "selfPay": round(total_amount - insurance_pay, 2),
            "visitCount7Days": random.randint(0, 1),
            "sameDrugCount30Days": random.randint(0, 2),
            "crossHospitalCount": random.randint(0, 1),
            "isOverDose": False,
            "isOverIndication": False,
            "isDuplicatePrescription": False,
            "city": "南京市",
            "district": hospital["district"],
            "abnormalType": "fake_hospitalization",
        })
    return records


def generate_over_indication_records(start_id, count, patient_pool, used_trace_codes):
    """生成超适应症用药异常记录"""
    records = []
    for _ in range(count):
        patient_id = random.choice(patient_pool)
        hospital = random.choice(HOSPITALS)
        doctor_idx = random.randint(0, len(DOCTORS) - 1)
        # 选一个常见诊断，但开不匹配的药品
        diagnosis = random.choice(["上呼吸道感染", "急性支气管炎", "胃炎", "关节炎"])
        drug = select_drug_for_diagnosis(diagnosis, abnormal_type="over_indication")
        
        duration = random.choice([7, 14])
        quantity = drug["dailyDose"] * duration
        unit_price = round(random.uniform(*drug["priceRange"]), 2)
        drug_amount = round(quantity * unit_price, 2)
        other_fee = round(random.uniform(20, 100), 2)
        total_amount = round(drug_amount + other_fee, 2)
        insurance_pay = round(total_amount * random.uniform(0.6, 0.85), 2)
        
        trace_code = generate_trace_code()
        used_trace_codes[trace_code].append(patient_id)
        
        records.append({
            "recordId": f"R{start_id + len(records):08d}",
            "patientId": patient_id,
            "name": f"{random.choice('赵钱孙李周吴郑王')}**",
            "gender": random.choice(GENDERS),
            "age": random.randint(25, 65),
            "insuranceType": random.choice(INSURANCE_TYPES),
            "insuredCity": "南京市",
            "visitTime": random_time_in_last_30_days().strftime("%Y-%m-%d %H:%M"),
            "hospitalId": hospital["id"],
            "hospitalName": hospital["name"],
            "hospitalLevel": hospital["level"],
            "department": random.choice(DEPARTMENTS),
            "doctorId": DOCTORS[doctor_idx],
            "doctorName": DOCTOR_NAMES[doctor_idx],
            "visitType": random.choice(["门诊", "急诊"]),
            "diagnosis": diagnosis,
            "icd10Code": ICD10_CODES[diagnosis],
            "isChronic": False,
            "severity": "普通",
            "drugName": drug["name"],
            "drugCode": f"YP{DRUGS.index(drug)+1:03d}",
            "drugCategory": drug["category"],
            "isInsuranceCovered": drug["insurance"],
            "isCentralizedProcurement": drug["procurement"],
            "dailyDose": drug["dailyDose"],
            "duration": duration,
            "quantity": quantity,
            "unitPrice": unit_price,
            "drugAmount": drug_amount,
            "traceCode": trace_code,
            "prescriptionType": "院内",
            "totalAmount": total_amount,
            "insurancePay": insurance_pay,
            "selfPay": round(total_amount - insurance_pay, 2),
            "visitCount7Days": random.randint(0, 2),
            "sameDrugCount30Days": random.randint(0, 2),
            "crossHospitalCount": random.randint(0, 1),
            "isOverDose": False,
            "isOverIndication": True,
            "isDuplicatePrescription": False,
            "city": "南京市",
            "district": hospital["district"],
            "abnormalType": "over_indication",
        })
    return records


# ==================== 主生成逻辑 ====================

def generate_all_records():
    """生成全部 200 条记录"""
    used_trace_codes = defaultdict(list)
    all_records = []
    record_id = 1
    
    # 1. 正常记录 140 条
    for _ in range(140):
        record = generate_normal_record(record_id, PATIENTS, used_trace_codes)
        all_records.append(record)
        record_id += 1
    
    # 2. 频繁就医：生成约 16 条记录（2 个患者，每人 7-10 次）
    frequent_records = generate_frequent_visit_records(record_id, 2, PATIENTS, used_trace_codes)
    all_records.extend(frequent_records)
    record_id += len(frequent_records)
    
    # 3. 超量开药 15 条
    over_dose_records = generate_over_dose_records(record_id, 15, PATIENTS, used_trace_codes)
    all_records.extend(over_dose_records)
    record_id += len(over_dose_records)
    
    # 4. 跨院重复开药：生成约 10 条记录（4 个患者，每人 2-3 家医院）
    cross_hospital_records = generate_cross_hospital_records(record_id, 4, PATIENTS, used_trace_codes)
    all_records.extend(cross_hospital_records)
    record_id += len(cross_hospital_records)
    
    # 5. 串换药品 8 条
    trace_code_records = generate_trace_code_abnormal_records(record_id, 4, PATIENTS, used_trace_codes)
    all_records.extend(trace_code_records)
    record_id += len(trace_code_records)
    
    # 6. 虚假住院 4 条
    fake_records = generate_fake_hospitalization_records(record_id, 4, PATIENTS, used_trace_codes)
    all_records.extend(fake_records)
    record_id += len(fake_records)
    
    # 7. 超适应症 3 条
    over_indication_records = generate_over_indication_records(record_id, 3, PATIENTS, used_trace_codes)
    all_records.extend(over_indication_records)
    record_id += len(over_indication_records)
    
    # 按时间排序
    all_records.sort(key=lambda x: x["visitTime"])
    
    # 重新分配 recordId
    for i, record in enumerate(all_records, 1):
        record["recordId"] = f"R{i:08d}"
    
    return all_records, used_trace_codes


def generate_overview(records, gangs_count=0):
    """生成监管总览数据"""
    abnormal_records = [r for r in records if r["abnormalType"]]
    high_risk_types = ["trace_code_abnormal", "fake_hospitalization", "frequent_visit"]
    high_risk_records = [r for r in abnormal_records if r["abnormalType"] in high_risk_types]
    
    total_amount = sum(r["totalAmount"] for r in records)
    abnormal_amount = sum(r["totalAmount"] for r in abnormal_records)
    
    # 统计各区风险金额
    district_risk = defaultdict(float)
    for r in abnormal_records:
        district_risk[r["district"]] += r["totalAmount"]
    
    # 统计异常类型
    abnormal_type_count = defaultdict(int)
    for r in abnormal_records:
        abnormal_type_count[r["abnormalType"]] += 1
    
    return {
        "scanDate": "2026-06-16",
        "totalRecords": len(records),
        "totalAmount": round(total_amount, 2),
        "abnormalRecords": len(abnormal_records),
        "abnormalAmount": round(abnormal_amount, 2),
        "highRiskRecords": len(high_risk_records),
        "highRiskAmount": round(sum(r["totalAmount"] for r in high_risk_records), 2),
        "suspectedGangs": gangs_count,
        "districtRisk": {k: round(v, 2) for k, v in district_risk.items()},
        "abnormalTypeCount": dict(abnormal_type_count),
    }


def generate_alerts(records):
    """生成高风险告警列表"""
    alerts = []
    alert_id = 1
    
    abnormal_type_names = {
        "frequent_visit": "频繁就医",
        "over_dose": "超量开药",
        "cross_hospital": "跨院重复开药",
        "trace_code_abnormal": "追溯码异常（疑似串换药品）",
        "fake_hospitalization": "疑似虚假住院/挂床",
        "over_indication": "超适应症用药",
    }
    
    risk_levels = {
        "frequent_visit": "中",
        "over_dose": "中",
        "cross_hospital": "高",
        "trace_code_abnormal": "极高",
        "fake_hospitalization": "高",
        "over_indication": "中",
    }
    
    for record in records:
        if not record["abnormalType"]:
            continue
        
        alerts.append({
            "id": f"A{alert_id:08d}",
            "recordId": record["recordId"],
            "type": abnormal_type_names[record["abnormalType"]],
            "level": risk_levels[record["abnormalType"]],
            "status": "待研判",
            "patientId": record["patientId"],
            "patient": record["name"],
            "hospital": record["hospitalName"],
            "doctor": record["doctorName"],
            "amount": record["totalAmount"],
            "district": record["district"],
            "reason": f"患者 {record['name']} 在 {record['hospitalName']} 就诊，{abnormal_type_names[record['abnormalType']]}",
            "time": record["visitTime"],
        })
        alert_id += 1
    
    # 按风险等级排序
    level_order = {"极高": 0, "高": 1, "中": 2, "低": 3}
    alerts.sort(key=lambda x: level_order[x["level"]])
    
    return alerts


def generate_network(records):
    """生成关系网络数据"""
    nodes = {}
    edges = []
    edge_map = defaultdict(int)
    
    # 团伙：按 traceCode 分组（串换药品）和 cross_hospital 分组
    gangs = []
    trace_gangs = defaultdict(set)
    cross_gangs = defaultdict(set)
    
    for record in records:
        # 添加节点
        pid = record["patientId"]
        did = record["doctorId"]
        hid = record["hospitalId"]
        
        if pid not in nodes:
            nodes[pid] = {"id": pid, "name": record["name"], "type": "patient", "value": 0}
        if did not in nodes:
            nodes[did] = {"id": did, "name": record["doctorName"], "type": "doctor", "value": 0}
        if hid not in nodes:
            nodes[hid] = {"id": hid, "name": record["hospitalName"], "type": "hospital", "value": 0}
        
        nodes[pid]["value"] += record["totalAmount"]
        nodes[did]["value"] += record["totalAmount"]
        nodes[hid]["value"] += record["totalAmount"]
        
        # 边：患者-医生
        edge_key = (pid, did)
        edge_map[edge_key] += 1
        
        # 边：医生-医院
        edge_key2 = (did, hid)
        edge_map[edge_key2] += 1
        
        # 团伙识别
        if record["abnormalType"] == "trace_code_abnormal":
            trace_gangs[record["traceCode"]].add(pid)
            trace_gangs[record["traceCode"]].add(did)
            trace_gangs[record["traceCode"]].add(hid)
        elif record["abnormalType"] == "cross_hospital":
            cross_key = f"{record['patientId']}_{record['drugCode']}"
            cross_gangs[cross_key].add(pid)
            cross_gangs[cross_key].add(did)
            cross_gangs[cross_key].add(hid)
    
    # 合并团伙
    for members in trace_gangs.values():
        gangs.append(members)
    for members in cross_gangs.values():
        gangs.append(members)
    
    # 只保留成员 >= 3 的团伙，并分配 gangId
    gang_id = 1
    node_gang = {}
    valid_gangs = []
    
    for members in gangs:
        if len(members) >= 3:
            valid_gangs.append(members)
            for member in members:
                # 一个节点可能属于多个团伙，这里取第一个
                if member not in node_gang:
                    node_gang[member] = f"G{gang_id:03d}"
            gang_id += 1
    
    for node_id, gang in node_gang.items():
        if node_id in nodes:
            nodes[node_id]["gangId"] = gang
    
    for (source, target), value in edge_map.items():
        edges.append({"source": source, "target": target, "value": value})
    
    return {
        "nodes": list(nodes.values()),
        "edges": edges,
        "gangs": len(valid_gangs),
        "gangDetails": [
            {"id": f"G{i+1:03d}", "members": list(members)}
            for i, members in enumerate(valid_gangs)
        ]
    }


def generate_case_analysis(alerts):
    """生成典型案例研判结果（预生成，用于 Demo 快速展示）
    
    包含每个 Agent 的置信度，以及协调器 Agent 的冲突消解结论。
    """
    analysis = []
    
    for alert in alerts[:20]:  # 取前 20 个高风险告警
        # 根据异常类型设置不同的 Agent 置信度，模拟真实场景下的意见差异
        if "追溯码异常" in alert["type"]:
            # 追溯码异常：证据确凿，所有 Agent 高置信度
            confidences = [95, 92, 96, 94, 95]
        elif "虚假住院" in alert["type"]:
            # 虚假住院：行为模式明显
            confidences = [88, 90, 85, 87, 89]
        elif "频繁就医" in alert["type"]:
            # 频繁就医：数据检索高，模式识别和风险量化略低
            confidences = [92, 78, 82, 75, 85]
        elif "超适应症" in alert["type"]:
            # 超适应症：医学 Agent 高，其他中等
            confidences = [80, 85, 88, 82, 84]
        elif "跨院重复" in alert["type"]:
            # 跨院重复：多 Agent 协同验证
            confidences = [86, 88, 84, 83, 87]
        else:
            # 默认
            confidences = [85, 83, 86, 80, 84]
        
        agents = [
            {
                "role": "数据检索 Agent",
                "result": f"患者 {alert['patient']} 近 30 天内在南京市 {alert['district']} 有多次就诊记录，涉及金额 ¥{alert['amount']}。",
                "confidence": confidences[0]
            },
            {
                "role": "模式识别 Agent",
                "result": f"判定为「{alert['type']}」，符合异常模式特征。",
                "confidence": confidences[1]
            },
            {
                "role": "规则匹配 Agent",
                "result": "违反《医疗保障基金使用监督管理条例》相关规定，涉嫌违规使用医保基金。",
                "confidence": confidences[2]
            },
            {
                "role": "风险量化 Agent",
                "result": f"风险等级：{alert['level']}，建议优先处置。",
                "confidence": confidences[3]
            },
            {
                "role": "证据链整理 Agent",
                "result": f"已整理就诊时间线、药品追溯码、费用明细等证据材料。",
                "confidence": confidences[4]
            },
        ]
        
        # 协调器 Agent：综合各 Agent 意见，处理冲突
        avg_confidence = round(sum(confidences) / len(confidences))
        if alert["level"] == "极高":
            coordinator_result = f"各 Agent 置信度均较高（平均 {avg_confidence}%），证据链完整，建议立即启动飞检。"
        elif alert["level"] == "高":
            coordinator_result = f"多数 Agent 判定为高风险（平均置信度 {avg_confidence}%），建议优先核查。"
        else:
            coordinator_result = f"部分 Agent 提示异常（平均置信度 {avg_confidence}%），建议进一步核实。"
        
        analysis.append({
            "alertId": alert["id"],
            "recordId": alert["recordId"],
            "agents": agents,
            "coordinator": {
                "role": "协调器 Agent",
                "result": coordinator_result,
                "confidence": avg_confidence
            },
            "report": {
                "summary": f"患者 {alert['patient']} 在 {alert['hospital']} 就诊时出现{alert['type']}行为。",
                "riskLevel": alert["level"],
                "basis": alert["reason"],
                "associationRisk": "存在关联异常风险，建议扩大核查范围。",
                "suggestion": "建议启动现场核查，调取原始病历和处方，访谈医生和患者。"
            },
            "task": {
                "taskNo": f"F{alert['id'][1:]}",
                "target": alert["hospital"],
                "points": [
                    f"核查患者 {alert['patient']} 就诊真实性",
                    f"核实{alert['type']}的具体情况",
                    "调取相关处方、病历、费用明细",
                    "访谈责任医生和患者"
                ],
                "deadline": "2026-06-23",
                "level": alert["level"]
            }
        })
    
    return analysis


def main():
    """主函数"""
    print("开始生成基金监管天眼 mock 数据...")
    
    # 生成记录
    records, used_trace_codes = generate_all_records()
    print(f"生成记录数：{len(records)}")
    
    # 统计异常类型
    abnormal_count = defaultdict(int)
    for r in records:
        if r["abnormalType"]:
            abnormal_count[r["abnormalType"]] += 1
    print("异常类型分布：", dict(abnormal_count))
    
    # 生成衍生数据（注意顺序：network 先生成，再生成 overview）
    network = generate_network(records)
    overview = generate_overview(records, network["gangs"])
    alerts = generate_alerts(records)
    case_analysis = generate_case_analysis(alerts)
    
    # 检查追溯码异常
    trace_abnormal = {k: v for k, v in used_trace_codes.items() if len(v) > 1}
    print(f"追溯码重复组数：{len(trace_abnormal)}")
    
    # 输出路径
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    mock_dir = os.path.join(base_dir, "src", "mock")
    os.makedirs(mock_dir, exist_ok=True)
    
    # 写入文件
    with open(os.path.join(mock_dir, "records.json"), "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)
    
    with open(os.path.join(mock_dir, "overview.json"), "w", encoding="utf-8") as f:
        json.dump(overview, f, ensure_ascii=False, indent=2)
    
    with open(os.path.join(mock_dir, "alerts.json"), "w", encoding="utf-8") as f:
        json.dump(alerts, f, ensure_ascii=False, indent=2)
    
    with open(os.path.join(mock_dir, "network.json"), "w", encoding="utf-8") as f:
        json.dump(network, f, ensure_ascii=False, indent=2)
    
    with open(os.path.join(mock_dir, "caseAnalysis.json"), "w", encoding="utf-8") as f:
        json.dump(case_analysis, f, ensure_ascii=False, indent=2)
    
    print(f"数据已写入：{mock_dir}")
    print("生成完成！")


if __name__ == "__main__":
    main()
