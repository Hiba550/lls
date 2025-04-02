import os
import django
import csv
import io

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.item_master.models import ItemMaster

# Item master data provided in the request
item_master_data = """
SNo\tItem Type\tProduct\tItem Code\tDescription\tPart Type\tUom\tCode
1\tPart\t\t409001297\tSAFETY (NYLOC) NUT M4 ZINC PLATED\t\tNos\t
2\tPart\t\t409037290\tWASHER M6\t\tNos\t
3\tPart\t\t409047250\tWASHER UR 10X4.3X0.8 ZINC PLATED (M4)\t\tNos\t
4\tPart\t\t409085400\tHEX SOC HEAD CAP SCREW S21 M6X16 BLACKENED\t\tNos\t
5\tPart\t\t4EC350401\tPVC CORRUGATED FLEXIBLE CONDUITS PIPE WO AL GREY 3/4 INCHES - (PART NO:YF170)\t\tNos\t
6\tPart\t\t4RS014009\tT – BOLTS M4 X L14\t\tNos\t
7\tPart\t\t4YB012052\tILI YBS - SPACER\t\tNos\t
8\tPart\t\t4YB012053\tILI YBS - END COVER\t\tNos\t
9\tPart\t\t4YB013257\tYBS ILI POWER SUPPLY TO FIRST DUCT 4-PIN CONNECTOR CABLE KIT - (70MM PITCH)\tYBS WHA\tNos\tU
10\tPart\t\t4YB013270\tYBS Power Supply to First duct cable assembly -AX\tYBS WHA\tNos\tW
11\tPart\t\t4YB013322\tYBS ILI POWER SUPPLY TO FIRST DUCT 4-PIN CONNECTOR CABLE KIT - AX PANEL - V2\tYBS WHA\tNos\t0W
12\tPart\t\t4YB013240\tASSEMBLED MACHINE INTERFACE ILI PCB - REV 1\tPCBA\tNos\tI
13\tPart\t\t4YB013248\tASSEMBLED YBS ILI MASTER PCB - 24 SPINDLES -BL-T VER-REV 1\tPCBA\tNos\t8
14\tPart\t\t4YB013249\tASSEMBLED YBS ILI MASTER PCB - 25 SPINDLES -BL-T VER-REV 1\tPCBA\tNos\t9
15\tPart\t\t4YB013250\tASSEMBLED YBS ILI SLAVE LEFT PCB - BL VER - T - REV 1\tPCBA\tNos\tL
16\tPart\t\t4YB013251\tASSEMBLED YBS ILI SLAVE RIGHT PCB - BL VER - T - REV 1\tPCBA\tNos\tR
17\tPart\t\t4YB013271\tAssembled YBS ILI Slave Right PCB - BL Ver - T (65mm Pitch)\tPCBA\tNos\tS
18\tBOM\t\t5YB013184\tCOMMUNICATION LINE FOR H/S LED DISPLAY FROM T/S PANEL\tIn HosueAssembly\tNos\t
19\tPart\t\t4YB013321\tYBS ILI POWER SUPPLY TO FIRST DUCT 4-PIN CONNECTOR CABLE KIT - (70MM PITCH) - V2\tYBS WHA\tNos\t0U
20\tConsumable\t\t611300022\tYBS PACKING BOX COMPLETE - 1(LWH-3000mmx900mmx320mm)\t\tNos\t
21\tConsumable\t\t611YB0016\tTILT WATCH XTR AT 80 DEGRES - 24101\t\tNos\t
22\tConsumable\t\t611YB0017\tSHOCK WATCH  STICKERS - MPN - 25G 48000K SW2\t\tNos\t
23\tConsumable\t\t618100378\tPALLET - YBS PACKING BOX EXPORT HEAT TREATED WOOD 3030 X 980 X 140 MM (L X B X H)\t\tNos\t
24\tConsumable\t\t628800053\tCARTON BOX 540 X 300 X 510MM\t\tNos\t
25\tPart\t\t860YB6041\tRATCHET SPANNER 7MM - AEAF0607 - MAKE : JETECH TOOL\t\tNos\t
26\tPart\t\t4EC351045\tWE-AFB EMI SUPPRESSION AXIAL FERRITE BEAD 25HZ ID-18Ø, OD-28Ø, L-28.5(WURTH-74270095)\t\tNos\t
27\tPart\t\t4EC400015\tSINGLE CORE WIRE 1 SQMM YELLOW WITH GREEN (4510003)\t\tMts\t
28\tPart\t\t4EC600038\tROUND SOCKET 2.5 SQMM\t\tNos\t
29\tPart\t\t4YB013258\tBOARD TO BOARD PICOBLADE CABLE ASSY (SINGLE ROW 115MM, 14 CKTS) FOR ILI PCB ASSY\tWHA\tNos\tV
30\tPart\t\t5YB013254\tRAP SENSOR HOUSING ASSEMBLY - 110MM - V2\tSensor\tNos\t1
31\tPart\t\t5YB013255\tRAP SENSOR HOUSING ASSEMBLY - 200MM - V2\tSensor\tNos\t2
32\tPart\t\t4RS013117\tRSM-POWER SUPPLY TO FIRST DUCT CABLE ASSY - BL VER - (70MM PITCH)\tRSM WHA\tNos\tA
33\tPart\t\t4RS013122\tRSM - RMC CABLE ASSEMBLY -  MASTER TO LEFT  (10-10) - 200MM - BL VER - RR\tRSM WHA\tNos\tH
34\tPart\t\t4RS013123\tRSM COMMUNICATION TERMINATION CABLE ASSY\tRSM WHA\tNos\tJ
35\tBOM\t\t5YB011445\tCRITICAL SPARES FOR - ILI YBS REGULAR V1 (70MM PITCH)\tIn HosueAssembly\tNos\t
36\tPart\t\t4YB013305\tILI YBS LEFT SLAVE PCB ASSEMBLY - V2\tPCBA\tNos\t0L
37\tPart\t\t409030913\tHEX NUT 0.8D M5X0.8-ZINC PLATED-2ND\t\tNos\t
38\tPart\t\t409047270\tWASHER UR 12X5.3X1.0 ZINC PLATED (M5)\t\tNos\t
39\tPart\t\t409085420\tHEX SOCKET HEAD SCREW S21 M5X16 BLACKENED\t\tNos\t
40\tPart\t\t449211041\tCABLE TIE CP100\t\tNos\t
41\tPart\t\t4EC600056\tPVC STRIP CONNECTOR 6 AMPS\t\tNos\t
42\tPart\t\t4EC700195\tMULTI COLOR SINGLE STAGE TOWER LAMP 18-24VDC (GREEN ELECTRICAL : MPN - T61-NGNT2-M(RGB)-V1-C1\t\tMts\t
43\tPart\t\t4RS012010\tPVC CORRUGATED FLEXIBLE CONDUITS PIPE WO AL GREY 1 INCHES - (PART NO:YF230)\t\tNos\t
44\tPart\t\t5G0133370\tLAMP POST COMPLETE\t\tNos\t
45\tPart\t\t4YB013307\tILI YBS MASTER PCB ASSEMBLY - 24 SPINDLES - V2\tPCBA\tNos\t08
46\tPart\t\t4YB013308\tILI YBS MASTER PCB ASSEMBLY - 25 SPINDLES - V2\tPCBA\tNos\t09
47\tPart\t\t409030910\tHEX NUT 0.8D M5X0.8-ZINC PLATED\t\tNos\t
48\tPart\t\t409030990\tHEX NUT 0.8D M8X1.25-ZINC PLATED\t\tNos\t
49\tPart\t\t409047320\tWASHER UR 18X8.4X2.0 ZINC PLATED (M8)\t\tNos\t
50\tPart\t\t409085201\tHEX SOC HEAD CAP SCREW S21 M8X16 ZINC PLATED\t\tNos\t
51\tPart\t\t409085421\tHEX SOC HEAD CAP SCREW S21 M5X16 ZINC  PLATED\t\tNos\t
52\tPart\t\t4YB013306\tILI YBS RIGHT SLAVE PCB ASSEMBLY - V2\tPCBA\tNos\t0R
53\tPart\t\t5YB014155\tSTAND FOR YBS BREAKS DISPLAY LED SCREEN TYPE - 3\t\tNos\t
54\tPart\t\t409030953\tM4 HEX NUT ZINC PLATED\t\tNos\t
55\tPart\t\t409048080\tSPRING WASHER M4\t\tNos\t
56\tPart\t\t409085351\tHEX SOC HEAD CAP SCREW S21 M4X10 ZINC PLATED\t\tNos\t
57\tPart\t\t449211043\tCABLE TIE CP200\t\tNos\t
58\tPart\t\t4RS012007\tCLAMP – RSM\t\tNos\t
59\tBOM\t\t5YB011074\tLTS Panel Assembly\tIn HosueAssembly\tNos\t-
60\tPart\t\t4RS013097\tASSEMBLED RSM SLAVE PCB BL VER - T\t\tNos\t6
61\tPart\t\t4RS013114\tASSEMBLED RSM MASTER PCB BL VER - T - REV 1\t\tNos\t7
62\tPart\t\t4RS013118\tRSM-POWER & COMMUNICATION CABLE ASSY WITH RMC - BL VER - (70MM PITCH)\tRSM WHA\tNos\tC
63\tPart\t\t5RS011059\tRSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - WHITE - ZANTY 75 MM\tRSM COIL\tNos\tWZ
64\tPart\t\t5RS011060\tRSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - GREY - ZANTY 75MM\tRSM COIL\tNos\tGZ
65\tPart\t\t5RS011061\tRSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - YELLOW - ZANTY 75 MM\tRSM COIL\tNos\tYZ
66\tPart\t\t5RS011062\tRSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - BLUE - ZANTY 75 MM\tRSM COIL\tNos\tBZ
67\tBOM\t\t5RS011077\tCRITICAL SPARES FOR - RSM (70MM PITCH)\t\tNos\t
68\tPart\t\t5RS013109\tHST FOR RSM JACK CABLE KIT\t\tNos\t
69\tPart\t\t5RS014005\tU_CLAMP – RSM\t\tNos\t
70\tPart\t\t5RS014040\tRSM STRAP MIDDLE\t\tNos\t
71\tPart\t\t5RS014041\tRSM STRAP END\t\tNos\t
72\tPart\t\t5RS014042\tRSM DUCT HEIGHT GAUGE\t\tNos\t
73\tPart\t\t5RS014052\tEND COVER - RSM DUCT ASSY\t\tNos\t
74\tPart\t\t5RS014053\tRSM DUCT HOLDER - 30MM - V2\t\tNos\t
75\tPart\t\t5RS014054\tRSM - RMC Cable - Master to Slave PCB (10-10) - 260MM - BL Ver - (65mm Pitch)\t\tNos\t6H
76\tPart\t\t5RS014055\tRSM - RMC Cable - Slave to Slave PCB (10-12) - 120MM - BL Ver - (65mm Pitch)\t\tNos\t6E
77\tPart\t\t5RS014056\tRSM - POWER & COMMUNICATION CABLE ASSY with RMC - BL Ver - (65mm Pitch)\t\tNos\t6C
78\tPart\t\t5RS014057\tRSM - POWER & COMMUNICATION CABLE ASSY without RMC - BL Ver - (65mm Pitch)\t\tNos\t6D
79\tPart\t\t4YB013324\tMACHINE INTERFACE PCB ASSEMBLY - V2 - WITHOUT RAP\tPCBA\tNos\t#
80\tBOM\t\t5YB013183\tPanel  to LED display cable ASSEMBLY (with earth cable)\tIn HosueAssembly\tNos\t
81\tPart\t\t4YB013151\tCAT 6 LAN CABLE ASSEMBLY - 5000MM\t\tNos\t
82\tPart\t\t4YB013252\tYBS COMMUNICATION TERMINATION CABLE ASSY - LEFT\tYBS WHA\tNos\tN
83\tPart\t\t5YB013001\t3-PHASE INPUT FROM MACHINE TO YBS MCB CABLE\t\tNos\t
84\tPart\t\t5YB013002\tFROM MACHINE PLC TO RELAY INPUT SIGNAL  CABLE\t\tNos\t
85\tPart\t\t5YB014156\tSENSOR HOUSING SETTING GAUGE\t\tNos\t
86\tPart\t\t5YB013156\tRELAY OUTPUT NO SUPPLY  & GND CABLE\t\tNos\t
87\tPart\t\t5YB013157\tRELAY OUTPUT NO SUPPLY & GND CABLE FROM T/S TO H/S\t\tNos\t
88\tPart\t\t4EC350525\tLED MACHINE DISPLAY DUAL SIDE WITH 485 COMMUNICATION\t\tNos\t
89\tPart\t\t4YB013253\tYBS COMMUNICATION TERMINATION CABLE ASSY - RIGHT\tYBS WHA\tNos\tO
90\tPart\t\t4YB013256\tYBS POWER & COMMUNICATION CABLE ASSY - 1750MM - (70MM PITCH)\tYBS WHA\tNos\tT
91\tPart\t\t4YB013265\tYBS POWER & COMMUNICATION CABLE ASSY - FOR T FLEX\tYBS WHA\tNos\t5
92\tPart\t\t4RS013126\tRSM POWER & COMMUNICATION CABLE ASSY - FOR T FLEX\tYBS WHA\tNos\t4
93\tBOM\t\t5YB011099\tRAP - ILI DUCT ASSEMBLY - 23 spindles (PITCH-65 mm)\tIn HosueAssembly\tNos\t63
94\tPart\t\t5YB013256\tRAP Sensor housing assembly - 110mm (65mm Pitch)\tSensor\tNos\t61
95\tPart\t\t5YB013257\tRAP Sensor housing assembly - 200mm (65mm Pitch)\tSensor\tNos\t62
96\tPart\t\t5YB013262\tRAP Sensor housing assembly - 110mm (75mm Pitch)\tSensor\tNos\t51
97\tPart\t\t5YB013263\tRAP Sensor housing assembly - 200mm (75mm Pitch)\tSensor\tNos\t52
98\tPart\t\t4YB013255\tYBS POWER & COMMUNICATION CABLE ASSY -1680mm\tYBS WHA\tNos\tQ
99\tPart\t\t4YB013254\tYBS POWER & COMMUNICATION CABLE ASSY -1610mm\tYBS WHA\tNos\tP
100\tPart\t\t4YB013272\tYBS POWER & COMMUNICATION CABLE ASSY -1725mm - (75 Pitch)\tYBS WHA\tNos\t5P
101\tPart\t\t4YB013273\tYBS POWER & COMMUNICATION CABLE ASSY -1800mm - (75 Pitch)\tYBS WHA\tNos\t5Q
102\tPart\t\t4YB013274\tYBS POWER & COMMUNICATION CABLE ASSY -1875mm - (75 Pitch)\tYBS WHA\tNos\t5T
103\tPart\t\t4YB013275\tBoard to Board Cable ASSY (Single Row 160mm; 14 CKTS) for ILI PCB ASSY\tYBS WHA\tNos\t5B
104\tPart\t\tTYB012092\tYBS POWER & COMMUNICATION CABLE ASSY -1495mm (PITCH - 65 mm)\tYBS WHA\tNos\t6P
105\tBOM\t\t5YB011100\tRAP - ILI DUCT ASSEMBLY - 24 spindles (PITCH-65 mm)\tIn HosueAssembly\tNos\t64
106\tBOM\t\t5YB011101\tRAP - ILI DUCT ASSEMBLY - 25 spindles (PITCH-65 mm)\tIn HosueAssembly\tNos\t65
107\tBOM\t\t5YB011112\tRAP ILI DUCT ASSEMBLY - 24 spindles (PITCH-75 mm)\tIn HosueAssembly\tNos\t74
108\tBOM\t\t5YB011111\tRAP ILI End DUCT ASSEMBLY - 23 spindle (PITCH-75 mm)\tIn HosueAssembly\tNos\t73
109\tBOM\t\t5YB011113\tRAP ILI End DUCT ASSEMBLY - 25 spindles (PITCH-75 mm)\tIn HosueAssembly\tNos\t75
110\tBOM\t\t5RS014058\tRSM DUCT ASSY-1 BL Ver - (65mm Pitch) 1M-3S Duct Assy \tIn HosueAssembly\tNos\t66
111\tPart\t\t4RS013119\tRSM -  POWER & COMMUNICATION CABLE ASSY without RMC - BL Ver\tRSM WHA\tNos\tD
112\tPart\t\t4RS013120\tRSM - RMC Cable Assembly – Slave to slave PCB (10-12) - 80MM - BL Ver\tRSM WHA\tNos\tE
113\tPart\t\t4RS013121\tRSM - RMC Cable Assembly -  Master to Right slave PCB (10-10) -90MM - BL Ver\tRSM WHA\tNos\tF
114\tPart\t\t4RS013130\tRSM - POWER SUPPLY to FIRST DUCT CABLE ASSY - BL Ver - AX Panel\tRSM WHA\tNos\tX
115\tPart\t\t4RS013148\tRSM - RMC Cable - Master to Slave PCB (10-10) - 260MM - BL Ver - (75mm Pitch)\tRSM WHA\tNos\t5H
116\tPart\t\t4RS013147\tRSM - RMC Cable - Slave to Slave PCB (10-12) - 120MM - BL Ver - (75mm Pitch)\tRSM WHA\tNos\t5E
117\tPart\t\t4RS013145\tRSM - POWER & COMMUNICATION CABLE ASSY with RMC - BL Ver - (75mm Pitch)\tRSM WHA\tNos\t5C
118\tPart\t\t4RS013146\tRSM - POWER & COMMUNICATION CABLE ASSY without RMC - BL Ver - (75mm Pitch)\tRSM WHA\tNos\t5D
119\tBOM\t\t5RS011075\tRSM DUCT ASSY-1 BL Ver - (75mm Pitch) 1M-3S Duct Assy \tIn HosueAssembly\tNos\t13
120\tBOM\t\t5RS011027\tRSM DUCT ASSY-1 BL VER (70mm Pitch) 1M-3S Duct Assy \tIn HosueAssembly\tNos\t11
121\tPart\t\t4EC200168\tSMPS 48V 20A 3PH (AB : 1606-XLS960F-3)\t\tNos\t
122\tPart\t\t4EC200259\tSMPS 24V 10A 1PH (SCHNEIDER ELECTRIC - ABLP1A24100)\t\tNos\t
123\tPart\t\t4EC200261\t450VA SINGLE PHASE TRANSFORMER (PROCON - 415 V,2PH - 220V, 1PH)\t\tNos\t
124\tBOM\t\t5RS014059\tRSM DUCT ASSY-2 BL Ver - (65mm Pitch) 3S Duct Assy\tIn HosueAssembly\tNos\t60
125\tPart\t\t5YB013042\t3-PHASE INPUT FROM MCB TO YBS PANEL CABLE\t\tNos\t
126\tPart\t\t5YB013132\tTOWER LAMP  ASSEMBLY FOR YBS\t\tNos\t
127\tBOM\t\t5YB013158\tDUAL LED DISPLAY ASSEMBLY  FOR H/S EXECUTION\t\tNos\t
128\tBOM\t\t5YB013164\tSingle  LED display Assembly  for T/S execution\t\tNos\t
129\tBOM\t\t5RS011028\tRSM DUCT ASSY-2 BL VER  (70mm Pitch) 3S Duct Assy\tIn HosueAssembly\tNos\t12
130\tBOM\t\t5RS011076\tRSM DUCT ASSY-2 BL Ver - (75mm Pitch) 3S Duct Assy\tIn HosueAssembly\tNos\t14
131\tBOM\t\t5RS011054\tRSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - BLUE - ZANTY\tIn HosueAssembly\tNos\tZB
132\tBOM\t\t5RS011052\tRSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - GREY - ZANTY\tIn HosueAssembly\tNos\tZG
133\tBOM\t\t5RS011051\tRSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - WHITE - ZANTY\tIn HosueAssembly\tNos\tZW
134\tBOM\t\t5RS011053\tRSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - YELLOW - ZANTY\tIn HosueAssembly\tNos\tZY
135\tBOM\t\t5YB011072\tSingle phase Electrical panel Assembly - YBS ILI - AX  machine\tIn HosueAssembly\tNos\tYA
136\tPart\t\t409034600\tHEX HEAD BOLT M10 X 30 MM\t\tNos\t
137\tPart\t\t409048170\tSPRING WASHER M10\t\tNos\t
138\tPart\t\tTYB012093\tYBS POWER & COMMUNICATION CABLE ASSY -1560mm (PITCH - 65 mm)\tYBS WHA\tNos\t6Q
139\tPart\t\tTYB012094\tYBS POWER & COMMUNICATION CABLE ASSY -1625mm (PITCH - 65 mm)\tYBS WHA\tNos\t6T
140\tPart\t\t4YB013315\tYBS COMMUNICATION TERMINATION CABLE ASSY - LEFT - V2\tYBS WHA\tNos\t0N
141\tPart\t\t4YB013316\tYBS COMMUNICATION TERMINATION CABLE ASSY - RIGHT - V2\tYBS WHA\tNos\t0O
142\tBOM\t\t5YB011070\tSINGLE PHASE ELECTRICAL PANEL ASSEMBLY - YBS ILI - SX  MACHINE\tIn HosueAssembly\tNos\tYS
143\tBOM\t\t5YB011073\tThree phase Electrical panel Assembly - YBS & RSM  AX machine\tIn HosueAssembly\tNos\tYRA
144\tBOM\t\t5YB011071\tThree phase Electrical panel Assembly - YBS & RSM SX machine\tIn HosueAssembly\tNos\tYRS
145\tBOM\t\t5YB011443\tYBS ILI AX THREE PHASE ELECTRICAL PANEL ASSEMBLY (WITHOUT RAP) - V2\tIn HosueAssembly\tNos\t
146\tBOM\tYBS/RSM/BTL/Q.Doff/LTS/RTS/Optical/Project\t5YB011056\tYBS ILI DUCT ASSEMBLY - 24 SPINDLES\tIn HosueAssembly\tNos\t24
147\tBOM\t\t5YB013159\tDUAL LED DISPLAY ASSEMBLY  FOR T/S EXECUTION\t\tNos\t
148\tConsumable\t\t618800010\tPALLET - YBS PACKING BOX - 3030 X 980 X140 MM (L X B X H)\t\tNos\t
149\tPart\t\tTYB012258\tILI YBS -SPACER V2\t\tNos\t
150\tPart\t\tTYB012259\tILI YBS -END COVER V2\t\tNos\t
"""

def process_tab_separated_data(data):
    """Process tab-separated data and return as list of dictionaries"""
    rows = []
    reader = csv.reader(io.StringIO(data), delimiter='\t')
    headers = next(row for row in reader if row and row[0] == 'SNo')
    
    for row in reader:
        if row and len(row) >= 7 and row[0].strip():  # At least 7 columns and SNo is not empty
            item_data = {
                'sno': int(row[0]) if row[0].strip().isdigit() else None,
                'type': row[1].strip(),
                'product': row[2].strip(),
                'item_code': row[3].strip(),
                'description': row[4].strip(),
                'part_type': row[5].strip(),
                'uom': row[6].strip(),
                'code': row[7].strip() if len(row) > 7 else None
            }
            rows.append(item_data)
    return rows

def import_items_to_db(items):
    """Import items to the database"""
    created_count = 0
    updated_count = 0
    
    for item_data in items:
        try:
            # Skip items with no item code
            if not item_data['item_code']:
                continue
                
            try:
                # Try to update existing item
                item = ItemMaster.objects.get(item_code=item_data['item_code'])
                
                # Update item fields
                item.sno = item_data['sno'] if item_data['sno'] else item.sno
                item.type = item_data['type']
                item.product = item_data['product']
                item.description = item_data['description']
                item.uom = item_data['uom']
                item.code = item_data['code']
                
                item.save()
                updated_count += 1
                
            except ItemMaster.DoesNotExist:
                # Create new item
                ItemMaster.objects.create(
                    sno=item_data['sno'],
                    type=item_data['type'],
                    product=item_data['product'],
                    item_code=item_data['item_code'],
                    description=item_data['description'],
                    uom=item_data['uom'],
                    code=item_data['code']
                )
                created_count += 1
                
        except Exception as e:
            print(f"Error processing item {item_data['item_code']}: {str(e)}")
    
    return {
        'created': created_count,
        'updated': updated_count,
        'total': created_count + updated_count
    }

def main():
    print("Starting Item Master data import...")
    items = process_tab_separated_data(item_master_data)
    
    if not items:
        print("No valid data found to import")
        return
    
    print(f"Found {len(items)} items to process")
    result = import_items_to_db(items)
    
    print(f"Import completed. Created: {result['created']}, Updated: {result['updated']}, Total: {result['total']}")

if __name__ == '__main__':
    main()