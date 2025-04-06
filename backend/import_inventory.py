import os
import django
import sys
import logging
from django.db import transaction

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from backend.apps.item_master.models import ItemMaster


item_data = """
SNo	Item Type	Product	Item Code	Description	Part Type	Uom	Code	U_OperName	Assembly	Burn test 	Packing	Image	Weight	Rev Reason	Rev No 	Customer Complaint Infromation
1	Part		409001297	SAFETY (NYLOC) NUT M4 ZINC PLATED		Nos					Image					
2	Part		409037290	WASHER M6		Nos					Image					
3	Part		409047250	WASHER UR 10X4.3X0.8 ZINC PLATED (M4)		Nos					Image					
4	Part		409085400	HEX SOC HEAD CAP SCREW S21 M6X16 BLACKENED		Nos					Image					
5	Part		4EC350401	PVC CORRUGATED FLEXIBLE CONDUITS PIPE WO AL GREY 3/4 INCHES - (PART NO:YF170)		Nos					Image					
6	Part		4RS014009	T – BOLTS M4 X L14		Nos					Image					
7	Part		4YB012052	ILI YBS - SPACER		Nos					Image					
8	Part		4YB012053	ILI YBS - END COVER		Nos					Image					
9	Part		4YB013257	YBS ILI POWER SUPPLY TO FIRST DUCT 4-PIN CONNECTOR CABLE KIT - (70MM PITCH)	YBS WHA	Nos	U				Serial					
10	Part		4YB013270	YBS Power Supply to First duct cable assembly -AX	YBS WHA	Nos	W				Y					
11	Part		4YB013322	YBS ILI POWER SUPPLY TO FIRST DUCT 4-PIN CONNECTOR CABLE KIT - AX PANEL - V2	YBS WHA	Nos	0W									
12	Part		4YB013240	ASSEMBLED MACHINE INTERFACE ILI PCB - REV 1	PCBA	Nos	I				Y					
13	Part		4YB013248	ASSEMBLED YBS ILI MASTER PCB - 24 SPINDLES -BL-T VER-REV 1	PCBA	Nos	8				Serial					
14	Part		4YB013249	ASSEMBLED YBS ILI MASTER PCB - 25 SPINDLES -BL-T VER-REV 1	PCBA	Nos	9				Serial					
15	Part		4YB013250	ASSEMBLED YBS ILI SLAVE LEFT PCB - BL VER - T - REV 1	PCBA	Nos	L				Serial					
16	Part		4YB013251	ASSEMBLED YBS ILI SLAVE RIGHT PCB - BL VER - T - REV 1	PCBA	Nos	R				Serial					
17	Part		4YB013271	Assembled YBS ILI Slave Right PCB - BL Ver - T (65mm Pitch)	PCBA	Nos	S				Y					
18	BOM		5YB013184	COMMUNICATION LINE FOR H/S LED DISPLAY FROM T/S PANEL	In HosueAssembly	Nos					Y					
19	Part		4YB013321	YBS ILI POWER SUPPLY TO FIRST DUCT 4-PIN CONNECTOR CABLE KIT - (70MM PITCH) - V2	YBS WHA	Nos	0U									
20	Consumable		611300022	YBS PACKING BOX COMPLETE - 1(LWH-3000mmx900mmx320mm)		Nos					Image					
21	Consumable		611YB0016	TILT WATCH XTR AT 80 DEGRES - 24101		Nos					Image					
22	Consumable		611YB0017	SHOCK WATCH  STICKERS - MPN - 25G 48000K SW2		Nos					Image					
23	Consumable		618100378	PALLET - YBS PACKING BOX EXPORT HEAT TREATED WOOD 3030 X 980 X 140 MM (L X B X H)		Nos					Image					
24	Consumable		628800053	CARTON BOX 540 X 300 X 510MM		Nos					Image					
25	Part		860YB6041	RATCHET SPANNER 7MM - AEAF0607 - MAKE : JETECH TOOL		Nos					Image					
26	Part		4EC351045	WE-AFB EMI SUPPRESSION AXIAL FERRITE BEAD 25HZ ID-18Ø, OD-28Ø, L-28.5(WURTH-74270095)		Nos					Image					
27	Part		4EC400015	SINGLE CORE WIRE 1 SQMM YELLOW WITH GREEN (4510003)		Mts					Image					
28	Part		4EC600038	ROUND SOCKET 2.5 SQMM		Nos					Image					
29	Part		4YB013258	BOARD TO BOARD PICOBLADE CABLE ASSY (SINGLE ROW 115MM, 14 CKTS) FOR ILI PCB ASSY	WHA	Nos	V				Serial					
30	Part		5YB013254	RAP SENSOR HOUSING ASSEMBLY - 110MM - V2	Sensor	Nos	1				Serial					
31	Part		5YB013255	RAP SENSOR HOUSING ASSEMBLY - 200MM - V2	Sensor	Nos	2				Serial					
32	Part		4RS013117	RSM-POWER SUPPLY TO FIRST DUCT CABLE ASSY - BL VER - (70MM PITCH)	RSM WHA	Nos	A				Serial					
33	Part		4RS013122	RSM - RMC CABLE ASSEMBLY -  MASTER TO LEFT  (10-10) - 200MM - BL VER - RR	RSM WHA	Nos	H				Serial					
34	Part		4RS013123	RSM COMMUNICATION TERMINATION CABLE ASSY	RSM WHA	Nos	J				Serial					
35	BOM		5YB011445	CRITICAL SPARES FOR - ILI YBS REGULAR V1 (70MM PITCH)	In HosueAssembly	Nos										
36	Part		4YB013305	ILI YBS LEFT SLAVE PCB ASSEMBLY - V2	PCBA	Nos	0L									
37	Part		409030913	HEX NUT 0.8D M5X0.8-ZINC PLATED-2ND		Nos					Image	Serial				
38	Part		409047270	WASHER UR 12X5.3X1.0 ZINC PLATED (M5)		Nos					Image	Serial				
39	Part		409085420	HEX SOCKET HEAD SCREW S21 M5X16 BLACKENED		Nos					Image	Serial				
40	Part		449211041	CABLE TIE CP100		Nos					Image	Serial				
41	Part		4EC600056	PVC STRIP CONNECTOR 6 AMPS		Nos					Image					
42	Part		4EC700195	MULTI COLOR SINGLE STAGE TOWER LAMP 18-24VDC (GREEN ELECTRICAL : MPN - T61-NGNT2-M(RGB)-V1-C1		Mts					Image					
43	Part		4RS012010	PVC CORRUGATED FLEXIBLE CONDUITS PIPE WO AL GREY 1 INCHES - (PART NO:YF230)		Nos					Image					
44	Part		5G0133370	LAMP POST COMPLETE		Nos					Image					
45	Part		4YB013307	ILI YBS MASTER PCB ASSEMBLY - 24 SPINDLES - V2	PCBA	Nos	08									
46	Part		4YB013308	ILI YBS MASTER PCB ASSEMBLY - 25 SPINDLES - V2	PCBA	Nos	09									
47	Part		409030910	HEX NUT 0.8D M5X0.8-ZINC PLATED		Nos					Image					
48	Part		409030990	HEX NUT 0.8D M8X1.25-ZINC PLATED		Nos					Image					
49	Part		409047320	WASHER UR 18X8.4X2.0 ZINC PLATED (M8)		Nos					Image					
50	Part		409085201	HEX SOC HEAD CAP SCREW S21 M8X16 ZINC PLATED		Nos					Image					
51	Part		409085421	HEX SOC HEAD CAP SCREW S21 M5X16 ZINC  PLATED		Nos					Image					
52	Part		4YB013306	ILI YBS RIGHT SLAVE PCB ASSEMBLY - V2	PCBA	Nos	0R									
53	Part		5YB014155	STAND FOR YBS BREAKS DISPLAY LED SCREEN TYPE - 3		Nos					Image					
54	Part		409030953	M4 HEX NUT ZINC PLATED		Nos					Image					
55	Part		409048080	SPRING WASHER M4		Nos					Image					
56	Part		409085351	HEX SOC HEAD CAP SCREW S21 M4X10 ZINC PLATED		Nos					Weighable					
57	Part		449211043	CABLE TIE CP200		Nos					Image					
58	Part		4RS012007	CLAMP – RSM		Nos					Image					
59	BOM		5YB011074	LTS Panel Assembly	In HosueAssembly	Nos	-	Panel Assembly	Y	N	Y					
60	Part		4RS013097	ASSEMBLED RSM SLAVE PCB BL VER - T		Nos	6				Serial					
61	Part		4RS013114	ASSEMBLED RSM MASTER PCB BL VER - T - REV 1		Nos	7				Serial					
62	Part		4RS013118	RSM-POWER & COMMUNICATION CABLE ASSY WITH RMC - BL VER - (70MM PITCH)	RSM WHA	Nos	C				Serial					
63	Part		5RS011059	RSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - WHITE - ZANTY 75 MM	RSM COIL	Nos	WZ				Serial					
64	Part		5RS011060	RSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - GREY - ZANTY 75MM	RSM COIL	Nos	GZ				Serial					
65	Part		5RS011061	RSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - YELLOW - ZANTY 75 MM	RSM COIL	Nos	YZ				Serial					
66	Part		5RS011062	RSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - BLUE - ZANTY 75 MM	RSM COIL	Nos	BZ				Serial					
67	BOM		5RS011077	CRITICAL SPARES FOR - RSM (70MM PITCH)		Nos					Image					
68	Part		5RS013109	HST FOR RSM JACK CABLE KIT		Nos					Image					
69	Part		5RS014005	U_CLAMP – RSM		Nos					Image					
70	Part		5RS014040	RSM STRAP MIDDLE		Nos					Image					
71	Part		5RS014041	RSM STRAP END		Nos					Image					
72	Part		5RS014042	RSM DUCT HEIGHT GAUGE		Nos					Image					
73	Part		5RS014052	END COVER - RSM DUCT ASSY		Nos					Image					
74	Part		5RS014053	RSM DUCT HOLDER - 30MM - V2		Nos					Image					
75	Part		5RS014054	RSM - RMC Cable - Master to Slave PCB (10-10) - 260MM - BL Ver - (65mm Pitch)		Nos	6H									
76	Part		5RS014055	RSM - RMC Cable - Slave to Slave PCB (10-12) - 120MM - BL Ver - (65mm Pitch)		Nos	6E									
77	Part		5RS014056	RSM - POWER & COMMUNICATION CABLE ASSY with RMC - BL Ver - (65mm Pitch)		Nos	6C									
78	Part		5RS014057	RSM - POWER & COMMUNICATION CABLE ASSY without RMC - BL Ver - (65mm Pitch)		Nos	6D									
79	Part		4YB013324	MACHINE INTERFACE PCB ASSEMBLY - V2 - WITHOUT RAP	PCBA	Nos	#									
80	BOM		5YB013183	Panel  to LED display cable ASSEMBLY (with earth cable)	In HosueAssembly	Nos					Y					
81	Part		4YB013151	CAT 6 LAN CABLE ASSEMBLY - 5000MM		Nos				Y	Y					
82	Part		4YB013252	YBS COMMUNICATION TERMINATION CABLE ASSY - LEFT	YBS WHA	Nos	N				Serial					
83	Part		5YB013001	3-PHASE INPUT FROM MACHINE TO YBS MCB CABLE		Nos				Y	Y					
84	Part		5YB013002	FROM MACHINE PLC TO RELAY INPUT SIGNAL  CABLE		Nos				Y	Y					
85	Part		5YB014156	SENSOR HOUSING SETTING GAUGE		Nos					Y					
86	Part		5YB013156	RELAY OUTPUT NO SUPPLY  & GND CABLE		Nos					Y					
87	Part		5YB013157	RELAY OUTPUT NO SUPPLY & GND CABLE FROM T/S TO H/S		Nos					Y					
88	Part		4EC350525	LED MACHINE DISPLAY DUAL SIDE WITH 485 COMMUNICATION		Nos					Y					
89	Part		4YB013253	YBS COMMUNICATION TERMINATION CABLE ASSY - RIGHT	YBS WHA	Nos	O				Serial					
90	Part		4YB013256	YBS POWER & COMMUNICATION CABLE ASSY - 1750MM - (70MM PITCH)	YBS WHA	Nos	T				Serial					
91	Part		4YB013265	YBS POWER & COMMUNICATION CABLE ASSY - FOR T FLEX	YBS WHA	Nos	5			Y	Y					
92	Part		4RS013126	RSM POWER & COMMUNICATION CABLE ASSY - FOR T FLEX	YBS WHA	Nos	4				Y					
93	BOM		5YB011099	RAP - ILI DUCT ASSEMBLY - 23 spindles (PITCH-65 mm)	In HosueAssembly	Nos	63		Y	Y	Y					
94	Part		5YB013256	RAP Sensor housing assembly - 110mm (65mm Pitch)	Sensor	Nos	61				Y					
95	Part		5YB013257	RAP Sensor housing assembly - 200mm (65mm Pitch)	Sensor	Nos	62				Y					
96	Part		5YB013262	RAP Sensor housing assembly - 110mm (75mm Pitch)	Sensor	Nos	51				Y					
97	Part		5YB013263	RAP Sensor housing assembly - 200mm (75mm Pitch)	Sensor	Nos	52				Y					
98	Part		4YB013255	YBS POWER & COMMUNICATION CABLE ASSY -1680mm	YBS WHA	Nos	Q				Y					
99	Part		4YB013254	YBS POWER & COMMUNICATION CABLE ASSY -1610mm	YBS WHA	Nos	P				Y					
100	Part		4YB013272	YBS POWER & COMMUNICATION CABLE ASSY -1725mm - (75 Pitch)	YBS WHA	Nos	5P				Y					
101	Part		4YB013273	YBS POWER & COMMUNICATION CABLE ASSY -1800mm - (75 Pitch)	YBS WHA	Nos	5Q				Y					
102	Part		4YB013274	YBS POWER & COMMUNICATION CABLE ASSY -1875mm - (75 Pitch)	YBS WHA	Nos	5T				Y					
103	Part		4YB013275	Board to Board Cable ASSY (Single Row 160mm; 14 CKTS) for ILI PCB ASSY	YBS WHA	Nos	5B				Y					
104	Part		TYB012092	YBS POWER & COMMUNICATION CABLE ASSY -1495mm (PITCH - 65 mm)	YBS WHA	Nos	6P				Y					
105	BOM		5YB011100	RAP - ILI DUCT ASSEMBLY - 24 spindles (PITCH-65 mm)	In HosueAssembly	Nos	64		Y	Y	Y					
106	BOM		5YB011101	RAP - ILI DUCT ASSEMBLY - 25 spindles (PITCH-65 mm)	In HosueAssembly	Nos	65		Y	Y	Y					
107	BOM		5YB011112	RAP ILI DUCT ASSEMBLY - 24 spindles (PITCH-75 mm)	In HosueAssembly	Nos	74		Y	Y	Y					
108	BOM		5YB011111	RAP ILI End DUCT ASSEMBLY - 23 spindle (PITCH-75 mm)	In HosueAssembly	Nos	73		Y	Y	Y					
109	BOM		5YB011113	RAP ILI End DUCT ASSEMBLY - 25 spindles (PITCH-75 mm)	In HosueAssembly	Nos	75		Y	Y	Y					
110	BOM		5RS014058	RSM DUCT ASSY-1 BL Ver - (65mm Pitch) 1M-3S Duct Assy 	In HosueAssembly	Nos	66	RSM	Y	Y	Serial	Serial				
111	Part		4RS013119	RSM -  POWER & COMMUNICATION CABLE ASSY without RMC - BL Ver	RSM WHA	Nos	D				Y					
112	Part		4RS013120	RSM - RMC Cable Assembly – Slave to slave PCB (10-12) - 80MM - BL Ver	RSM WHA	Nos	E				Y					
113	Part		4RS013121	RSM - RMC Cable Assembly -  Master to Right slave PCB (10-10) -90MM - BL Ver	RSM WHA	Nos	F				Y					
114	Part		4RS013130	RSM - POWER SUPPLY to FIRST DUCT CABLE ASSY - BL Ver - AX Panel	RSM WHA	Nos	X				Y					
115	Part		4RS013148	RSM - RMC Cable - Master to Slave PCB (10-10) - 260MM - BL Ver - (75mm Pitch)	RSM WHA	Nos	5H				Y					
116	Part		4RS013147	RSM - RMC Cable - Slave to Slave PCB (10-12) - 120MM - BL Ver - (75mm Pitch)	RSM WHA	Nos	5E				Y					
117	Part		4RS013145	RSM - POWER & COMMUNICATION CABLE ASSY with RMC - BL Ver - (75mm Pitch)	RSM WHA	Nos	5C				Y					
118	Part		4RS013146	RSM - POWER & COMMUNICATION CABLE ASSY without RMC - BL Ver - (75mm Pitch)	RSM WHA	Nos	5D				Y					
119	BOM		5RS011075	RSM DUCT ASSY-1 BL Ver - (75mm Pitch) 1M-3S Duct Assy 	In HosueAssembly	Nos	13	RSM	Y	Y	Serial	Serial				
120	BOM		5RS011027	RSM DUCT ASSY-1 BL VER (70mm Pitch) 1M-3S Duct Assy 	In HosueAssembly	Nos	11	RSM	Y	Y	Serial	Serial				
121	Part		4EC200168	SMPS 48V 20A 3PH (AB : 1606-XLS960F-3)		Nos					Y					
122	Part		4EC200259	SMPS 24V 10A 1PH (SCHNEIDER ELECTRIC - ABLP1A24100)		Nos					Y					
123	Part		4EC200261	450VA SINGLE PHASE TRANSFORMER (PROCON - 415 V,2PH - 220V, 1PH)		Nos					Y					
124	BOM		5RS014059	RSM DUCT ASSY-2 BL Ver - (65mm Pitch) 3S Duct Assy	In HosueAssembly	Nos	60	RSM	Y	Y	Serial	Serial				
125	Part		5YB013042	3-PHASE INPUT FROM MCB TO YBS PANEL CABLE		Nos					Y					
126	Part		5YB013132	TOWER LAMP  ASSEMBLY FOR YBS		Nos					Y					
127	BOM		5YB013158	DUAL LED DISPLAY ASSEMBLY  FOR H/S EXECUTION		Nos					Y					
128	BOM		5YB013164	Single  LED display Assembly  for T/S execution		Nos					Y					
129	BOM		5RS011028	RSM DUCT ASSY-2 BL VER  (70mm Pitch) 3S Duct Assy	In HosueAssembly	Nos	12	RSM	Y	Y	Serial	Serial				
130	BOM		5RS011076	RSM DUCT ASSY-2 BL Ver - (75mm Pitch) 3S Duct Assy	In HosueAssembly	Nos	14	RSM	Y	Y	Serial	Serial				
131	BOM		5RS011054	RSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - BLUE - ZANTY	In HosueAssembly	Nos	ZB				Serial					
132	BOM		5RS011052	RSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - GREY - ZANTY	In HosueAssembly	Nos	ZG				Serial					
133	BOM		5RS011051	RSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - WHITE - ZANTY	In HosueAssembly	Nos	ZW				Serial					
134	BOM		5RS011053	RSM ACTUATOR ASSEMBLY WITH 9 NEWTON SPRING - YELLOW - ZANTY	In HosueAssembly	Nos	ZY				Serial					
135	BOM		5YB011072	Single phase Electrical panel Assembly - YBS ILI - AX  machine	In HosueAssembly	Nos	YA	Panel Assembly		Y	Y	Serial				
136	Part		409034600	HEX HEAD BOLT M10 X 30 MM		Nos										
137	Part		409048170	SPRING WASHER M10		Nos										
138	Part		TYB012093	YBS POWER & COMMUNICATION CABLE ASSY -1560mm (PITCH - 65 mm)	YBS WHA	Nos	6Q				Y					
139	Part		TYB012094	YBS POWER & COMMUNICATION CABLE ASSY -1625mm (PITCH - 65 mm)	YBS WHA	Nos	6T				Y					
140	Part		4YB013315	YBS COMMUNICATION TERMINATION CABLE ASSY - LEFT - V2	YBS WHA	Nos	0N									
141	Part		4YB013316	YBS COMMUNICATION TERMINATION CABLE ASSY - RIGHT - V2	YBS WHA	Nos	0O									
142	BOM		5YB011070	SINGLE PHASE ELECTRICAL PANEL ASSEMBLY - YBS ILI - SX  MACHINE	In HosueAssembly	Nos	YS	Panel Assembly		Y	Y	Serial				
143	BOM		5YB011073	Three phase Electrical panel Assembly - YBS & RSM  AX machine	In HosueAssembly	Nos	YRA	Panel Assembly		Y	Y	Serial				
144	BOM		5YB011071	Three phase Electrical panel Assembly - YBS & RSM SX machine	In HosueAssembly	Nos	YRS	Panel Assembly		Y	Y	Serial				
145	BOM		5YB011443	YBS ILI AX THREE PHASE ELECTRICAL PANEL ASSEMBLY (WITHOUT RAP) - V2	In HosueAssembly	Nos										
146	BOM	YBS/RSM/BTL/Q.Doff/LTS/RTS/Optical/Project	5YB011056	YBS ILI DUCT ASSEMBLY - 24 SPINDLES	In HosueAssembly	Nos	24	YBS 	Y	Y	Serial					
147	BOM		5YB013159	DUAL LED DISPLAY ASSEMBLY  FOR T/S EXECUTION		Nos										
148	Consumable		618800010	PALLET - YBS PACKING BOX - 3030 X 980 X140 MM (L X B X H)		Nos										
149	Part		TYB012258	ILI YBS -SPACER V2		Nos										
150	Part		TYB012259	ILI YBS -END COVER V2		Nos										
151	Part		4EC500016	MULTI CORE CABLE 4 X0.5 SQMM (LAPP:1119754)		Mts										
152	Part		4EC500022	MULTI CORE CABLE 4 G1.5 SQMM (LAPP:1119304)		Mts										
153	Part		4EC200011	SINGLE POLE  RELAY  (MAKE-KULUR RIM-01R)		Nos										
154	Part		4EC400011	SINGLE CORE WIRE 0.75 SQMM BLACK 4510012		Nos										
155	Part		5YB012162	LAMP POST COMPLETE		Nos										
156	Part		409025081	HEXAGON SOCKET BUTTON HEAD CAP SCREW-M6X10		Nos										
157	Part		409025130	HEX SOCKET BUTTON HEAD SCREW S25 M5X10 BLACKENED		Nos										
158	Part		409030930	HEX NUT 0.8D M6X1 BLACKENED		Nos										
159	Part		409047300	WASHER UR 14X6.7X1.5 ZINC PLATED (M6)		Nos										
160	Part		409085100	HEXAGON SOCKET HEAD CAP SCREW-M8X10		Nos										
161	Part		443014158	DOOR HANDLE 74X110		Nos										
162	Part		449217156	COOLING FAN 24VDC 0.17A MAKE: REXNORD		Nos										
163	Part		4E16856029200	RUBBER  GROMMET		Nos										
164	Part		4EC200012	RAIL MOUNTED RELAY DOUBLE POLE R-1C1 24 VDC (MAKE:KULUR)		Nos										
165	Part		4EC200288	SMPS 24V 10A 3PH-DIN RAIL MOUNT_P.NO: TDR-240-24 (MEAN WELL)		Nos										
166	Part		4EC200299	MCB 3P 6A, C CURVE		Nos										
167	Part		4EC200301	MCB 1P 4A, C CURVE		Nos										
168	Part		4EC20A568	MCB 1P,10A,DC		Nos										
169	Part		4EC400012	SINGLE CORE WIRE 0.75SQMM BLUE (4510022) MAKE: LAPP		Nos										
170	Part		4EC400017	SINGLE CORE WIRE 1.5 SQMM BLACK (4520011) MAKE: LAPP		Nos										
171	Part		4EC400019	SINGLE CORE WIRE 1.5 SQMM BLUE (4520141S)		Nos										
172	Part		4EC400067	LAPP KABEL 4510031 WIRE HOOK UP H05V-K HAR POWER/CONTROL PVC BROWN 0.5 MM²		Mts										
173	Part		4EC400068	LAPP KABEL 4510121 WIRE HOOK UP H05V-K HAR POWER/CONTROL PVC GREEN 0.5 MM²		Mts										
174	Part		4EC400069	LAPP KABEL 4510111 WIRE HOOK UP H05V-K HAR POWER/CONTROL PVC YELLOW 0.5 MM²		Mts										
175	Part		4EC400070	LAPP KABEL 4510051 WIRE HOOK UP H05V-K HAR POWER/CONTROL PVC WHITE 0.5 MM²		Mts										
176	Part		4EC600001	PVC DUCT SLOTTED 25*45*1000 MAKE: SALZER		Nos										
177	Part		4EC600011	DIN RAIL SLOTTED MAKE: TRINITY		Nos										
178	Part		4EC600016	PRINTING SLEEVE -3.2 SQ MM-WHITE		Mts										
179	Part		4EC600020	PRINTING STICKER--9 SQ MM-YELLOW		Mts										
180	Part		4EC600028	PRESS SLEEVE TWIN 0.75 SQMM		Mts										
181	Part		4EC600031	PRESS SLEEVE 1.5Q MM		Mts										
182	Part		4EC600034	PRESS SLEEVE 1.5 TWIN SQMM		Mts										
183	Part		4EC600572	4-CONDUCTOR GROUND TERMINAL BLOCK 2.5 SQMMYELLOW GREEN (CONNECTWELL - CXG2.5/4)		Nos										
184	Part		4EC600573	4-CONDUCTOR THROUGH TERMINAL BLOCK2.5 SQMMGRAY (CONNECTWELL - CX2.5/4)		Nos										
185	Part		4EC600574	END AND INTERMEDIATE PLATE 2.5 MM THICK (CONNECTWELL - EPCX2.5/4)		Nos										
186	Part		4EC600575	2-CONDUCTOR THROUGH TERMINAL BLOCK 2.5 SQ.MM (CONNECTWELL - CX2.5)		Nos										
187	Part		4EC600576	END AND INTERMEDIATE PLATE 2.5 MM THICK (CONNECTWELL - EPCX2.5)		Nos										
188	Part		4EC600577	END STOPPER (CONNECTWELL - CA103)		Nos										
189	Part		4EC600579	JUMPER FOR 2.5 SQMM SERIES (CONNECTWELL - JX2.5/2)		Nos										
190	Part		4EC600580	TERMINAL MARKING PLATE (CONNECTWELL - CA509/K5/WHT)		Nos										
191	Part		4EC600584	4-CONDUCTOR DOUBLE LEVEL TERMINAL BLOCK 2.5 SQ.MM (CONNECTWELL - CXDL2.5)		Nos										
192	Part		4EC600585	END AND INTERMEDIATE PLATE DOUBLE LEVEL 2.5 MM THICK (CONNECTWELL - EPCXDL2.5)		Nos										
193	Part		4EC700021	COOLING FAN GRILL		Nos										
194	Part		4EC700022	COOLING FAN FILTER		Nos										
195	Part		4QD001196	NAME PLATE  M/C NO		Nos										
196	Part		4YB012021	NAME PLATE LLS - YBS		Nos										
197	Part		5YB014024	PANEL BOX BOTTOM SHEET COMPLETE		Nos										
198	Part		5YB014055	PANEL BOX TOP SHEET		Nos										
199	Part		5YB014080	ELECTRICAL PANEL COMPONENT PLATE - YBS RSM		Nos										
200	Part		5YB014192	OEM ENCLOSER BOX ASSEMBLY NEW - ILI (IF PCB WITHOUT RAP) - V2		Nos										
201	Part		5YB016042	PLUG FIXING SHEET		Nos										
202	Part		4YB013320	YBS POWER & COMMUNICATION CABLE ASSY - FOR T FLEX - V2	YBS WHA	Nos	V5									
203	BOM		5YB011059	YBS ILI END DUCT ASSEMBLY - 23 SPINDLE	In HosueAssembly	Nos	23	YBS	Y	Y	Serial					
204	Part		4YB013317	YBS POWER & COMMUNICATION CABLE ASSY - 1610MM - (70MM PITCH) - V2	YBS WHA	Nos	0P									
205	Part		5YB012042	ALUMINUM DUCT FOR YBS -1678MM WITH POWDER COATING		Nos										
206	Part		4EC350857	LED TUBE FOR DUCT LED BL_VER		Nos										
207	BOM		5YB011057	YBS ILI END DUCT ASSEMBLY - 25 SPINDLES AT DRIVE END - H/S & BEFORE T-FLEX	In HosueAssembly	Nos	25	YBS	Y	Y	Serial					
208	BOM		5YB011446	YBS REGULAR ILI DUCT ASSEMBLY - 23 SPINDLES - V1	In HosueAssembly	Nos	D3									
209	BOM		5YB011447	YBS REGULAR ILI DUCT ASSEMBLY - 24 SPINDLES - V1	In HosueAssembly	Nos	D4									
210	Part		4YB013318	YBS POWER & COMMUNICATION CABLE ASSY - 1680MM - (70MM PITCH) - V2	YBS WHA	Nos	0Q									
211	Part		4YB013319	YBS POWER & COMMUNICATION CABLE ASSY - 1750MM - (70MM PITCH) - V2	YBS WHA	Nos	0T									
212	Part		5YB012043	ALUMINUM DUCT FOR YBS -1748MM WITH POWDER COATING		Nos										
213	Part		5YB013284	REGULAR SENSOR HOUSING ASSEMBLY - 100MM - V2	Sensor	Nos	S1									
214	Part		5YB013285	REGULAR SENSOR HOUSING ASSEMBLY - 130MM - V2	Sensor	Nos	S3									
215	Part		5YB013286	REGULAR SENSOR HOUSING ASSEMBLY - 180MM - V2	Sensor	Nos	S8									
216	Part		TYB012260	ILI YBS -PCB HOLDER V2		Nos										
217	Part		251000019	MS HR SHEET1250 X 2500 X 8.0MM		Nos										
218	Part		4EC350826	PLUGGABLE TERMINAL BLOCK WR-TBL-PLUG RISING CAGE 2 POSITIONS 3.5 MM PITCH 10A(WURTH : 691361100002)		Nos										
219	Part		4EC350909	SNAP-IN STOP SPACER WA-SNSN (WURTH : 709401500)		Nos										
220	Part		4EC600364	DIN RAIL MOUNTING CLIP (CONNECTWELL:CMTB35)		Nos										
221	Part		4QD004017	HEX SOC HEAD CAP  SCREW S21 M4X8 ZINC PLATED		Nos										
222	BOM		5YB011448	YBS REGULAR ILI DUCT ASSEMBLY - 25 SPINDLES - V1	In HosueAssembly	Nos	D5									
223	Part		5YB014193	OEM ENCLOSER BOX - BOTTOM COVER ASSY - V2		Nos										
224	Part		5YB014194	OEM ENCLOSER BOX - TOP COVER - V2		Nos										
225	Part		241000019	MS CR CA SHEET 1250 X 2500 X 3.0MM		Nos										
226	Part		409030750	WELDING NUT M6		Nos										
227	Part		409030757	HEXAGON WELD NUT M10		Nos										
228	Part		409066245	WELDING STUD M6X12		Nos										
229	Part		5YB014073	PANEL BUSH		Nos										
230	Part		241000022	MS CR CA SHEET 1250 X 2500 X 2.0MM		Nos										
231	Part		4YB012032	ALUMINUM DUCT FOR YBS - HARD ANODIZED - 1678MM		Nos										
232	Part		4YB012033	ALUMINUM DUCT FOR YBS - HARD ANODIZED - 1748MM		Nos										
233	Part		4YB012088	LAMP POST W/O POWDER COATING		Nos										
234	Part		232000052	EN 9 ROUND Ø 20.1 MM		Nos										
235	Part		409030755	HEXAGON WELD NUT M4		Nos										
236	Part		241000020	MS CR CA SHEET 1250 X 2500 X 1.0MM		Nos										
237	Part		4YB013323	BOARD TO BOARD PICOBLADE CABLE ASSY (SINGLE ROW 250MM, 14 CKTS) FOR ILI PCB ASSY - V2	YBS WHA	Nos	0V									
238	Part		4RS013156	RSM - POWER SUPPLY TO FIRST DUCT CABLE ASSY - AX PANEL - V2	RSM WHA	Nos	0X									
239	Part		4RS013155	RSM - POWER SUPPLY TO FIRST DUCT CABLE ASSY - (70MM PITCH) - V2	RSM WHA	Nos	OA									
240	Part		4RS013157	RSM - POWER & COMMUNICATION CABLE ASSY WITH RMC - (70MM PITCH) - V2	RSM WHA	Nos	0C									
241	Part		4RS013158	RSM - POWER & COMMUNICATION CABLE ASSY WITHOUT RMC - (70MM PITCH) - V2	RSM WHA	Nos	0D									
242	Part		4RS013159	RSM - RMC CABLE ASSEMBLY - SLAVE TO SLAVE PCB (10-12) - 250MM - (70MM PITCH) - V2	RSM WHA	Nos	0E									
243	Part		4RS013160	RSM - RMC CABLE ASSEMBLY - MASTER TO RIGHT SLAVE PCB (10-10) - 320MM - (70MM PITCH) - V2	RSM WHA	Nos	0F									
244	Part		4RS013161	RSM - RMC CABLE ASSEMBLY - MASTER TO LEFT SLAVE PCB (10-10) - 50MM - (70MM PITCH) - V2	RSM WHA	Nos	0G									
245	Part		4RS013162	RSM COMMUNICATION TERMINATION CABLE ASSY - V2	RSM WHA	Nos	0J									
246	Part		4RS013163	RSM POWER & COMMUNICATION CABLE ASSY - FOR T FLEX - V2	RSM WHA	Nos	0H									
247	Part		409048140	SPRING WASHER M8		Nos										
248	Part		409085411	HEX SOC HEAD CAP SCREW S21 M4X16 ZINC PLATED		Nos										
249	Part		449030993	HEX NUT  M8		Nos										
250	Consumable		5RS011017	RSM PACKING BOX ASSY		Nos										
251	BOM		5RS011080	RSM-SX/AX THREE PHASE ELECTRICAL PANEL ASSEMBLY												
252	BOM		5RS011092	RSM DUCT ASSY 1 - V2	In HosueAssembly	Nos										
253	BOM		5RS011093	RSM DUCT ASSY 2 - V2	In HosueAssembly	Nos										
254	BOM		5RS011094	CRITICAL SPARES FOR - RSM (70MM PITCH) - V2		Nos										
255	Consumable		611300068	RSM ACTUATOR TRAY COMPLETE		Nos										
256	Consumable		611300045	RSM PACKING BOX COMPLETE - 1(LWH-3000mmx900mmx695mm)		Nos										
257	Consumable		618800012	PALLET - RSM PACKING BOX EXPORT HEAT TREATED WOOD - 3015X915X140MM (LXBXT)		Nos										
258	Part		4EC200252	SMPS 48V 20A 3PH-DIN RAIL MOUNT_P.NO: TDR-960-48 (MEAN WELL)		Nos										
259	Part		4EC200311	MCB 1P 4A C CURVE - AC/DC		Nos										
260	Part		4EC600025	PRESS SLEEVE 0.5 SQMM		Nos										
261	Consumable		4RS012033	NAME PLATE LLS - RSM		Nos										
262	BOM		5RS011095	RSM ACTUATOR ASSEMBLY - 2PIN - V2	In HosueAssembly	Nos										
263	Part		4EC350528	HST - GREY -15.9MM SIZE INNER DIA - 150°C / FR  - RSFR-HT		Nos										
264	Part		228000015	MS SQUARE HOLLOW SECTION (SHS) : 20 X 20 2.5 THK		Mts										
265	Part		251000030	MS SHEET HRPO 2500 X 1250 X 4 MM		Mts										
266	Part		4RS012004	HOUSING – RSM		Nos										
267	Part		4RS012005	COVER CLAMP - RSM		Nos										
268	Part		4RS012006	LIFTER – RSM		Nos										
269	Part		4RS012008	LEVER – RSM.		Nos										
270	Part		4RS012009	WEDGE – RSM		Nos										
271	Part		4RS012034	M3 WASHER - 6.3MM OD		Nos										
272	Part		4RS012045	RSM COMPRESSION SPRING-38.5L - OPT VER - T		Nos										
273	Part		4RS013131	RSM COIL - PLUNGER ASSY- V2		Nos										
274	Part		4RS013154	RSM COIL & RMC CORE CABLE ASSY	RSMWHA	Mts										
275	Part		4RS014002	LEVER POS SPRING		Nos										
276	Part		4RS013151	RSM MASTER PCB ASSEMBLY - V2	PCBA	Nos	07									
277	Part		4RS013152	RSM SLAVE PCB ASSEMBLY - V2	PCBA	Nos	06									
278					Retro Fit PCB	PCBA	Nos	R1									
"""

def process_inventory_data(data_text):
    """Processes tab-separated inventory data and returns structured data."""
    items = []
    lines = data_text.strip().split('\n')

    header = lines[0].split('\t')  # Capture the header

    for i, line in enumerate(lines[1:], start=1):
        line = line.strip()
        if not line:
            continue

        fields = line.split('\t')
        if len(fields) < 7:
            logging.warning(f"Line {i} has insufficient data: {line}")
            continue

        try:
            item_type = fields[1].strip()  # Important to strip
            if item_type not in ('Part', 'Consumable'):
                continue #Skip non-part items

            item_data = {
                'sno': int(fields[0].strip()) if fields[0].strip() else i,
                'type': 'Part',
                'product': fields[2].strip() if len(fields) > 2 else None,
                'item_code': fields[3].strip(),
                'description': fields[4].strip(),
                'uom': fields[6].strip() if len(fields) > 6 else 'Nos',
                'code': fields[7].strip() if len(fields) > 7 else None,
                'quantity': 0,
            }
            items.append(item_data)
        except ValueError as ve:
            logging.error(f"Error converting value on line {i}: {ve} - Line data: {line}")
        except KeyError as ke:
            logging.error(f"Missing key on line {i}: {ke} - Line data: {line}")
        except Exception as e:
            logging.error(f"General error processing line {i}: {e} - Line data: {line}")

    return items


@transaction.atomic
def import_inventory_to_db(items):
    """Imports inventory items to the database in a transactional manner."""

    created_count = 0
    updated_count = 0
    error_count = 0

    items_to_create = [] #list to store new items
    for item in items:
        try:
            item_code = item['item_code']
            try:
                existing_item = ItemMaster.objects.get(item_code=item_code)
                existing_item.quantity = 0
                existing_item.save()
                logging.info(f"Updated quantity for existing item: {item_code}")
                updated_count += 1
            except ItemMaster.DoesNotExist:
                # Prepare new ItemMaster instance for bulk creation
                new_item = ItemMaster(**item)
                items_to_create.append(new_item)

        except Exception as e:
            logging.error(f"Error processing item {item.get('item_code', 'N/A')}: {e}")
            error_count += 1
    try:
        ItemMaster.objects.bulk_create(items_to_create)  # Bulk create outside the inner loop
        created_count = len(items_to_create)
    except Exception as e:
        logging.error(f"Error during bulk_create: {e}")
        error_count += len(items_to_create)

    return {
        'created': created_count,
        'updated': updated_count,
        'error_count': error_count,
        'total_processed': len(items)
    }

def clear_existing_inventory():
    """Clears all existing inventory items from the database."""
    try:
        count, _ = ItemMaster.objects.all().delete()  # delete() returns (number_deleted, {model_name: count})
        logging.info(f"Cleared {count} existing inventory items.")
        return count
    except Exception as e:
        logging.error(f"Error clearing inventory: {e}")
        return None

def main():
    """Main function to orchestrate inventory import process."""
    logging.info("Starting Inventory Import Process...")

    items = process_inventory_data(item_data)
    logging.info(f"Processed {len(items)} inventory items from data")

    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        clear_existing_inventory()

    result = import_inventory_to_db(items)

    logging.info("Import completed:")
    logging.info(f"  - Created: {result['created']} new items")
    logging.info(f"  - Updated: {result['updated']} existing items")
    logging.info(f"  - Errors: {result['error_count']}")
    logging.info(f"  - Total processed: {result['total_processed']}")

if __name__ == "__main__":
    main()