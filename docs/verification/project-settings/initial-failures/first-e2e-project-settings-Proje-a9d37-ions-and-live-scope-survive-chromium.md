# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/project-settings.spec.ts >> Project settings: real SQL/R results, model identity, undo, editor options and live scope survive
- Location: tests/e2e/project-settings.spec.ts:120:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('.result-grid tbody')
Timeout: 10000ms
- Expected  - 100
+ Received  +   1

- 0	0.5228479915408183
- 1	0.32633090881606835
- 2	0.5839252776219118
- 3	0.47499658804931666
- 4	0.1583522872804219
- 5	0.7497655433308247
- 6	0.10123771787655016
- 7	0.8101324713654974
- 8	0.5962929507710919
- 9	0.26102948952087796
- 10	0.7618695358154863
- 11	0.19722478967634605
- 12	0.013736983732436822
- 13	0.6741748364935088
- 14	0.7638779309256526
- 15	0.8094232829292184
- 16	0.24237563181004204
- 17	0.1245092217826611
- 18	0.8132888537114717
- 19	0.15008273309965886
- 20	0.47308800296732173
- 21	0.6581131447318955
- 22	0.7170142137296419
- 23	0.6882034183458603
- 24	0.14839645575724011
- 25	0.1489895323681053
- 26	0.7329332739196202
- 27	0.08716544287415508
- 28	0.014698884433466402
- 29	0.33223514360628187
- 30	0.8217685296933271
- 31	0.09935135866754718
- 32	0.534824415750694
- 33	0.7018998896590782
- 34	0.005213993564613382
- 35	0.6908791012773795
- 36	0.13148648277160147
- 37	0.6494407902313079
- 38	0.563657655967281
- 39	0.7295922557848865
- 40	0.14149424768866184
- 41	0.09840033914476219
- 42	0.4329926264279699
- 43	0.553033065093311
- 44	0.42384359976745745
- 45	0.4469597870949422
- 46	0.9189147059677062
- 47	0.05006737405370911
- 48	0.5968931834711098
- 49	0.281280303383194
- 50	0.663400655269139
- 51	0.6616514493483865
- 52	0.3986258106017436
- 53	0.0353961321113492
- 54	0.2143938474320991
- 55	0.13718805037121568
- 56	0.5193743774442336
- 57	0.40582868193204497
- 58	0.6567630797609012
- 59	0.14526391732356772
- 60	0.17760507475418852
- 61	0.190622056919623
- 62	0.5760859741993145
- 63	0.504129287838748
- 64	0.37311585315343787
- 65	0.8736758596880309
- 66	0.9048901215560213
- 67	0.2179049759350539
- 68	0.9574544750380555
- 69	0.23553747170092268
- 70	0.7215681203530542
- 71	0.1388157760831205
- 72	0.32688091435242045
- 73	0.5487091286188945
- 74	0.6039401561436044
- 75	0.9076424389403284
- 76	0.017277045445930613
- 77	0.13138294224680735
- 78	0.4510345929035804
- 79	0.8194170099754015
- 80	0.2921001865441559
- 81	0.7872102739057295
- 82	0.8173023471638284
- 83	0.4106515049863553
- 84	0.26200276258432537
- 85	0.36065530330038365
- 86	0.06220425079284317
- 87	0.45557589938902854
- 88	0.9501001772866834
- 89	0.0811754137550699
- 90	0.6561469271368153
- 91	0.7002786866958951
- 92	0.41471871280232586
- 93	0.5936079438412599
- 94	0.08080115255267963
- 95	0.920956600851914
- 96	0.7750276175399504
- 97	0.0021638966847419734
- 98	0.13931006120135728
- 99	0.8116293539571953
+ 00.522847991540818310.3263309088160683520.583925277621911830.4749965880493166640.158352287280421950.749765543330824760.1012377178765501670.810132471365497480.596292950771091990.26102948952087796100.7618695358154863110.19722478967634605120.013736983732436822130.6741748364935088140.7638779309256526150.8094232829292184160.24237563181004204170.1245092217826611180.8132888537114717190.15008273309965886200.47308800296732173210.6581131447318955220.7170142137296419230.6882034183458603240.14839645575724011250.1489895323681053260.7329332739196202270.08716544287415508280.014698884433466402290.33223514360628187300.8217685296933271310.09935135866754718320.534824415750694330.7018998896590782340.005213993564613382350.6908791012773795360.13148648277160147370.6494407902313079380.563657655967281390.7295922557848865400.14149424768866184410.09840033914476219420.4329926264279699430.553033065093311440.42384359976745745450.4469597870949422460.9189147059677062470.05006737405370911480.5968931834711098490.281280303383194500.663400655269139510.6616514493483865520.3986258106017436530.0353961321113492540.2143938474320991550.13718805037121568560.5193743774442336570.40582868193204497580.6567630797609012590.14526391732356772600.17760507475418852610.190622056919623620.5760859741993145630.504129287838748640.37311585315343787650.8736758596880309660.9048901215560213670.2179049759350539680.9574544750380555690.23553747170092268700.7215681203530542710.1388157760831205720.32688091435242045730.5487091286188945740.6039401561436044750.9076424389403284760.017277045445930613770.13138294224680735780.4510345929035804790.8194170099754015800.2921001865441559810.7872102739057295820.8173023471638284830.4106515049863553840.26200276258432537850.36065530330038365860.06220425079284317870.45557589938902854880.9501001772866834890.0811754137550699900.6561469271368153910.7002786866958951920.41471871280232586930.5936079438412599940.08080115255267963950.920956600851914960.7750276175399504970.0021638966847419734980.13931006120135728990.8116293539571953

Call log:
  - Expect "toHaveText" locator('.result-grid tbody') with timeout 10000ms
  - waiting for locator('.result-grid tbody')
    24 × locator resolved to <tbody>…</tbody>
       - unexpected value "00.522847991540818310.3263309088160683520.583925277621911830.4749965880493166640.158352287280421950.749765543330824760.1012377178765501670.810132471365497480.596292950771091990.26102948952087796100.7618695358154863110.19722478967634605120.013736983732436822130.6741748364935088140.7638779309256526150.8094232829292184160.24237563181004204170.1245092217826611180.8132888537114717190.15008273309965886200.47308800296732173210.6581131447318955220.7170142137296419230.6882034183458603240.14839645575724011250.1489895323681053260.7329332739196202270.08716544287415508280.014698884433466402290.33223514360628187300.8217685296933271310.09935135866754718320.534824415750694330.7018998896590782340.005213993564613382350.6908791012773795360.13148648277160147370.6494407902313079380.563657655967281390.7295922557848865400.14149424768866184410.09840033914476219420.4329926264279699430.553033065093311440.42384359976745745450.4469597870949422460.9189147059677062470.05006737405370911480.5968931834711098490.281280303383194500.663400655269139510.6616514493483865520.3986258106017436530.0353961321113492540.2143938474320991550.13718805037121568560.5193743774442336570.40582868193204497580.6567630797609012590.14526391732356772600.17760507475418852610.190622056919623620.5760859741993145630.504129287838748640.37311585315343787650.8736758596880309660.9048901215560213670.2179049759350539680.9574544750380555690.23553747170092268700.7215681203530542710.1388157760831205720.32688091435242045730.5487091286188945740.6039401561436044750.9076424389403284760.017277045445930613770.13138294224680735780.4510345929035804790.8194170099754015800.2921001865441559810.7872102739057295820.8173023471638284830.4106515049863553840.26200276258432537850.36065530330038365860.06220425079284317870.45557589938902854880.9501001772866834890.0811754137550699900.6561469271368153910.7002786866958951920.41471871280232586930.5936079438412599940.08080115255267963950.920956600851914960.7750276175399504970.0021638966847419734980.13931006120135728990.8116293539571953"

```

```yaml
- rowgroup:
  - row "0 0.5228479915408183":
    - cell "0"
    - cell "0.5228479915408183"
  - row "1 0.32633090881606835":
    - cell "1"
    - cell "0.32633090881606835"
  - row "2 0.5839252776219118":
    - cell "2"
    - cell "0.5839252776219118"
  - row "3 0.47499658804931666":
    - cell "3"
    - cell "0.47499658804931666"
  - row "4 0.1583522872804219":
    - cell "4"
    - cell "0.1583522872804219"
  - row "5 0.7497655433308247":
    - cell "5"
    - cell "0.7497655433308247"
  - row "6 0.10123771787655016":
    - cell "6"
    - cell "0.10123771787655016"
  - row "7 0.8101324713654974":
    - cell "7"
    - cell "0.8101324713654974"
  - row "8 0.5962929507710919":
    - cell "8"
    - cell "0.5962929507710919"
  - row "9 0.26102948952087796":
    - cell "9"
    - cell "0.26102948952087796"
  - row "10 0.7618695358154863":
    - cell "10"
    - cell "0.7618695358154863"
  - row "11 0.19722478967634605":
    - cell "11"
    - cell "0.19722478967634605"
  - row "12 0.013736983732436822":
    - cell "12"
    - cell "0.013736983732436822"
  - row "13 0.6741748364935088":
    - cell "13"
    - cell "0.6741748364935088"
  - row "14 0.7638779309256526":
    - cell "14"
    - cell "0.7638779309256526"
  - row "15 0.8094232829292184":
    - cell "15"
    - cell "0.8094232829292184"
  - row "16 0.24237563181004204":
    - cell "16"
    - cell "0.24237563181004204"
  - row "17 0.1245092217826611":
    - cell "17"
    - cell "0.1245092217826611"
  - row "18 0.8132888537114717":
    - cell "18"
    - cell "0.8132888537114717"
  - row "19 0.15008273309965886":
    - cell "19"
    - cell "0.15008273309965886"
  - row "20 0.47308800296732173":
    - cell "20"
    - cell "0.47308800296732173"
  - row "21 0.6581131447318955":
    - cell "21"
    - cell "0.6581131447318955"
  - row "22 0.7170142137296419":
    - cell "22"
    - cell "0.7170142137296419"
  - row "23 0.6882034183458603":
    - cell "23"
    - cell "0.6882034183458603"
  - row "24 0.14839645575724011":
    - cell "24"
    - cell "0.14839645575724011"
  - row "25 0.1489895323681053":
    - cell "25"
    - cell "0.1489895323681053"
  - row "26 0.7329332739196202":
    - cell "26"
    - cell "0.7329332739196202"
  - row "27 0.08716544287415508":
    - cell "27"
    - cell "0.08716544287415508"
  - row "28 0.014698884433466402":
    - cell "28"
    - cell "0.014698884433466402"
  - row "29 0.33223514360628187":
    - cell "29"
    - cell "0.33223514360628187"
  - row "30 0.8217685296933271":
    - cell "30"
    - cell "0.8217685296933271"
  - row "31 0.09935135866754718":
    - cell "31"
    - cell "0.09935135866754718"
  - row "32 0.534824415750694":
    - cell "32"
    - cell "0.534824415750694"
  - row "33 0.7018998896590782":
    - cell "33"
    - cell "0.7018998896590782"
  - row "34 0.005213993564613382":
    - cell "34"
    - cell "0.005213993564613382"
  - row "35 0.6908791012773795":
    - cell "35"
    - cell "0.6908791012773795"
  - row "36 0.13148648277160147":
    - cell "36"
    - cell "0.13148648277160147"
  - row "37 0.6494407902313079":
    - cell "37"
    - cell "0.6494407902313079"
  - row "38 0.563657655967281":
    - cell "38"
    - cell "0.563657655967281"
  - row "39 0.7295922557848865":
    - cell "39"
    - cell "0.7295922557848865"
  - row "40 0.14149424768866184":
    - cell "40"
    - cell "0.14149424768866184"
  - row "41 0.09840033914476219":
    - cell "41"
    - cell "0.09840033914476219"
  - row "42 0.4329926264279699":
    - cell "42"
    - cell "0.4329926264279699"
  - row "43 0.553033065093311":
    - cell "43"
    - cell "0.553033065093311"
  - row "44 0.42384359976745745":
    - cell "44"
    - cell "0.42384359976745745"
  - row "45 0.4469597870949422":
    - cell "45"
    - cell "0.4469597870949422"
  - row "46 0.9189147059677062":
    - cell "46"
    - cell "0.9189147059677062"
  - row "47 0.05006737405370911":
    - cell "47"
    - cell "0.05006737405370911"
  - row "48 0.5968931834711098":
    - cell "48"
    - cell "0.5968931834711098"
  - row "49 0.281280303383194":
    - cell "49"
    - cell "0.281280303383194"
  - row "50 0.663400655269139":
    - cell "50"
    - cell "0.663400655269139"
  - row "51 0.6616514493483865":
    - cell "51"
    - cell "0.6616514493483865"
  - row "52 0.3986258106017436":
    - cell "52"
    - cell "0.3986258106017436"
  - row "53 0.0353961321113492":
    - cell "53"
    - cell "0.0353961321113492"
  - row "54 0.2143938474320991":
    - cell "54"
    - cell "0.2143938474320991"
  - row "55 0.13718805037121568":
    - cell "55"
    - cell "0.13718805037121568"
  - row "56 0.5193743774442336":
    - cell "56"
    - cell "0.5193743774442336"
  - row "57 0.40582868193204497":
    - cell "57"
    - cell "0.40582868193204497"
  - row "58 0.6567630797609012":
    - cell "58"
    - cell "0.6567630797609012"
  - row "59 0.14526391732356772":
    - cell "59"
    - cell "0.14526391732356772"
  - row "60 0.17760507475418852":
    - cell "60"
    - cell "0.17760507475418852"
  - row "61 0.190622056919623":
    - cell "61"
    - cell "0.190622056919623"
  - row "62 0.5760859741993145":
    - cell "62"
    - cell "0.5760859741993145"
  - row "63 0.504129287838748":
    - cell "63"
    - cell "0.504129287838748"
  - row "64 0.37311585315343787":
    - cell "64"
    - cell "0.37311585315343787"
  - row "65 0.8736758596880309":
    - cell "65"
    - cell "0.8736758596880309"
  - row "66 0.9048901215560213":
    - cell "66"
    - cell "0.9048901215560213"
  - row "67 0.2179049759350539":
    - cell "67"
    - cell "0.2179049759350539"
  - row "68 0.9574544750380555":
    - cell "68"
    - cell "0.9574544750380555"
  - row "69 0.23553747170092268":
    - cell "69"
    - cell "0.23553747170092268"
  - row "70 0.7215681203530542":
    - cell "70"
    - cell "0.7215681203530542"
  - row "71 0.1388157760831205":
    - cell "71"
    - cell "0.1388157760831205"
  - row "72 0.32688091435242045":
    - cell "72"
    - cell "0.32688091435242045"
  - row "73 0.5487091286188945":
    - cell "73"
    - cell "0.5487091286188945"
  - row "74 0.6039401561436044":
    - cell "74"
    - cell "0.6039401561436044"
  - row "75 0.9076424389403284":
    - cell "75"
    - cell "0.9076424389403284"
  - row "76 0.017277045445930613":
    - cell "76"
    - cell "0.017277045445930613"
  - row "77 0.13138294224680735":
    - cell "77"
    - cell "0.13138294224680735"
  - row "78 0.4510345929035804":
    - cell "78"
    - cell "0.4510345929035804"
  - row "79 0.8194170099754015":
    - cell "79"
    - cell "0.8194170099754015"
  - row "80 0.2921001865441559":
    - cell "80"
    - cell "0.2921001865441559"
  - row "81 0.7872102739057295":
    - cell "81"
    - cell "0.7872102739057295"
  - row "82 0.8173023471638284":
    - cell "82"
    - cell "0.8173023471638284"
  - row "83 0.4106515049863553":
    - cell "83"
    - cell "0.4106515049863553"
  - row "84 0.26200276258432537":
    - cell "84"
    - cell "0.26200276258432537"
  - row "85 0.36065530330038365":
    - cell "85"
    - cell "0.36065530330038365"
  - row "86 0.06220425079284317":
    - cell "86"
    - cell "0.06220425079284317"
  - row "87 0.45557589938902854":
    - cell "87"
    - cell "0.45557589938902854"
  - row "88 0.9501001772866834":
    - cell "88"
    - cell "0.9501001772866834"
  - row "89 0.0811754137550699":
    - cell "89"
    - cell "0.0811754137550699"
  - row "90 0.6561469271368153":
    - cell "90"
    - cell "0.6561469271368153"
  - row "91 0.7002786866958951":
    - cell "91"
    - cell "0.7002786866958951"
  - row "92 0.41471871280232586":
    - cell "92"
    - cell "0.41471871280232586"
  - row "93 0.5936079438412599":
    - cell "93"
    - cell "0.5936079438412599"
  - row "94 0.08080115255267963":
    - cell "94"
    - cell "0.08080115255267963"
  - row "95 0.920956600851914":
    - cell "95"
    - cell "0.920956600851914"
  - row "96 0.7750276175399504":
    - cell "96"
    - cell "0.7750276175399504"
  - row "97 0.0021638966847419734":
    - cell "97"
    - cell "0.0021638966847419734"
  - row "98 0.13931006120135728":
    - cell "98"
    - cell "0.13931006120135728"
  - row "99 0.8116293539571953":
    - cell "99"
    - cell "0.8116293539571953"
```

# Test source

```ts
  68  |     await settingsOf(page).focus();
  69  |     await expect(page.getByRole('tooltip', {name: 'Einstellungen', exact: true})).toBeVisible();
  70  |     await settingsOf(page).press('Enter');
  71  |     await expect(page).toHaveURL(url + '/settings');
  72  |     await expect(settingsOf(page)).toHaveAttribute('aria-current', 'page');
  73  |     await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  74  |     await expect(nav.locator('.dw-nav-item')).toHaveCount(8);
  75  |     await expect(page.locator('.project-context')).toHaveText('Projekt: Einstellungen und Sitzung');
  76  |     await expect(
  77  |       page.getByText('Diese Einstellungen gelten für alle Projekte in diesem Browser.', {
  78  |         exact: true,
  79  |       }),
  80  |     ).toBeVisible();
  81  |     await expect(nav).toHaveCSS('width', '52px');
  82  |     expect((await sessionOf(page)).id).toBe(before.id);
  83  |     await page.goBack();
  84  |     await expect(page).toHaveURL(source);
  85  |     await page.goForward();
  86  |     await expect(page).toHaveURL(url + '/settings');
  87  |   }
  88  |   await nav.getByRole('button', {name: 'Navigation ausklappen', exact: true}).click();
  89  |   await page.getByLabel('Seitenleiste standardmässig eingeklappt').uncheck();
  90  |   await expect(page.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  91  |   await expect(nav).toHaveCSS('width', '212px');
  92  |   await page.getByLabel('Seitenleiste standardmässig eingeklappt').check();
  93  |   await expect(nav).toHaveCSS('width', '212px');
  94  |   for (const width of [1440, 1280, 390]) {
  95  |     await page.setViewportSize({width, height: 900});
  96  |     expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
  97  |       true,
  98  |     );
  99  |     await page.screenshot({
  100 |       path: info.outputPath('project-settings-' + width + '.png'),
  101 |       fullPage: true,
  102 |     });
  103 |   }
  104 |   await page.setViewportSize({width: 1280, height: 800});
  105 |   const style = await page.addStyleTag({content: 'html {font-size: 200%}'});
  106 |   expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  107 |   await page.screenshot({path: info.outputPath('project-settings-text-200.png'), fullPage: true});
  108 |   await style.evaluate((element) => element.parentNode?.removeChild(element));
  109 |   await page.reload();
  110 |   await expect(nav).toHaveCSS('width', '212px');
  111 |   expect((await sessionOf(page)).id).not.toBe(before.id);
  112 |   expect(workers).toEqual([]);
  113 |   // The explicit global entry remains engine-free and has no implicit project.
  114 |   await page.goto('/settings');
  115 |   await expect(nav.locator('.dw-nav-item')).toHaveCount(3);
  116 |   await expect(page.locator('.project-context')).toHaveCount(0);
  117 |   expect(workers).toEqual([]);
  118 | });
  119 |
  120 | test('Project settings: real SQL/R results, model identity, undo, editor options and live scope survive', async ({
  121 |   page,
  122 | }) => {
  123 |   const workers: {url: string; closed: boolean}[] = [];
  124 |   page.on('worker', (worker) => {
  125 |     const entry = {url: worker.url(), closed: false};
  126 |     workers.push(entry);
  127 |     worker.on('close', () => {
  128 |       entry.closed = true;
  129 |     });
  130 |   });
  131 |   const url = await create(page);
  132 |   const nav = navOf(page);
  133 |   await nav.getByRole('button', {name: 'SQL', exact: true}).click();
  134 |   const sqlUrl = page.url();
  135 |   await enter(page, 'SELECT i, random() AS zufall FROM range(350) t(i)');
  136 |   await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  137 |   await expect(page.locator('.result-grid tbody tr').first()).toBeVisible();
  138 |   const rows = await page.locator('.result-grid tbody').innerText();
  139 |   const editor = page.getByRole('textbox', {name: 'Analysecode'});
  140 |   await editor.press('ControlOrMeta+End');
  141 |   await editor.press('End');
  142 |   await page.keyboard.insertText('\n-- erhalten');
  143 |   await editor.press('ControlOrMeta+s');
  144 |   await nav.getByRole('button', {name: 'R', exact: true}).click();
  145 |   await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  146 |     timeout: 60000,
  147 |   });
  148 |   const rUrl = page.url();
  149 |   await enter(page, 'bleibt <- data.frame(wert=1:3); plot(bleibt$wert); cat("Sitzung bleibt")');
  150 |   await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  151 |   await expect(page.locator('.r-plot img')).toBeVisible();
  152 |   await expect(
  153 |     page.getByRole('button', {name: 'bleibt 3 Zeilen, 1 Spalte', exact: true}),
  154 |   ).toBeEnabled();
  155 |   const before = await sessionOf(page);
  156 |   const runtime = await runtimeOf(page);
  157 |   const count = workers.length;
  158 |   await settingsOf(page).click();
  159 |   await expect(page).toHaveURL(url + '/settings');
  160 |   await page.getByLabel('Editor-Schriftgrösse').selectOption('18');
  161 |   await page.getByLabel('Zeilennummern', {exact: true}).uncheck();
  162 |   await page.getByLabel('Zeilenumbruch', {exact: true}).check();
  163 |   await expect(page.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  164 |   await nav.getByRole('button', {name: 'SQL', exact: true}).click();
  165 |   await expect(page).toHaveURL(sqlUrl);
  166 |   await expect(page.locator('.view-lines')).toHaveCSS('font-size', '18px');
  167 |   await expect(page.locator('.line-numbers')).toHaveCount(0);
> 168 |   await expect(page.locator('.result-grid tbody')).toHaveText(rows);
      |                                                    ^ Error: expect(locator).toHaveText(expected) failed
  169 |   await expect(page.locator('.view-lines')).toContainText('-- erhalten');
  170 |   await editor.press('ControlOrMeta+z');
  171 |   await expect(page.locator('.view-lines')).not.toContainText('-- erhalten');
  172 |   await editor.press('ControlOrMeta+Shift+z');
  173 |   await expect(page.locator('.view-lines')).toContainText('-- erhalten');
  174 |   await editor.press('ControlOrMeta+s');
  175 |   await settingsOf(page).click();
  176 |   await page.goBack();
  177 |   await expect(page).toHaveURL(sqlUrl);
  178 |   await page.goForward();
  179 |   await expect(page).toHaveURL(url + '/settings');
  180 |   await nav.getByRole('button', {name: 'R', exact: true}).click();
  181 |   await expect(page).toHaveURL(rUrl);
  182 |   await expect(page.locator('.r-plot img')).toBeVisible();
  183 |   await expect(
  184 |     page.getByRole('button', {name: 'bleibt 3 Zeilen, 1 Spalte', exact: true}),
  185 |   ).toBeEnabled();
  186 |   await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled();
  187 |   expect(await runtimeOf(page)).toEqual(runtime);
  188 |   const after = await sessionOf(page);
  189 |   expect(after.id).toBe(before.id);
  190 |   expect(after.document.runs).toEqual(before.document.runs);
  191 |   expect(after.document.results).toEqual(before.document.results);
  192 |   expect(workers).toHaveLength(count);
  193 |   expect(workers.every((worker) => !worker.closed)).toBe(true);
  194 |   await expect(page.locator('.app-error')).toHaveCount(0);
  195 | });
  196 |
  197 | for (const kind of ['sql', 'r'] as const) {
  198 |   test(
  199 |     'Project settings: active ' +
  200 |       kind.toUpperCase() +
  201 |       ' continues through settings and cancels after return',
  202 |     async ({page}) => {
  203 |       const url = await create(page);
  204 |       await navOf(page)
  205 |         .getByRole('button', {name: kind === 'sql' ? 'SQL' : 'R', exact: true})
  206 |         .click();
  207 |       const analysisUrl = page.url();
  208 |       await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  209 |         timeout: 60000,
  210 |       });
  211 |       await enter(
  212 |         page,
  213 |         kind === 'sql'
  214 |           ? 'SELECT sum(a.i*b.i) FROM range(100000000) a(i), range(100000000) b(i)'
  215 |           : 'while (TRUE) { sqrt(42) }',
  216 |       );
  217 |       await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  218 |       await expect(page.getByRole('button', {name: 'Abbrechen', exact: true})).toBeEnabled();
  219 |       const before = await sessionOf(page);
  220 |       expect(before.busy).not.toBeNull();
  221 |       await settingsOf(page).click();
  222 |       await expect(page).toHaveURL(url + '/settings');
  223 |       const during = await sessionOf(page);
  224 |       expect(during.id).toBe(before.id);
  225 |       expect(during.document.runs).toEqual(before.document.runs);
  226 |       expect(during.busy).toBe(before.busy);
  227 |       await page.goBack();
  228 |       await expect(page).toHaveURL(analysisUrl);
  229 |       await expect(page.getByRole('button', {name: 'Abbrechen', exact: true})).toBeEnabled();
  230 |       await expect(page.locator('.app-error')).toHaveCount(0);
  231 |       expect((await sessionOf(page)).id).toBe(before.id);
  232 |       await page.getByRole('button', {name: 'Abbrechen', exact: true}).click();
  233 |       await expect.poll(async () => (await sessionOf(page)).busy).toBeNull();
  234 |       await expect(page.locator('.run-summary-message')).toHaveText('Ausführung abgebrochen');
  235 |       await expect(page.getByRole('button', {name: 'Ausführen', exact: true})).toBeEnabled({
  236 |         timeout: 60000,
  237 |       });
  238 |       await expect(page.locator('.app-error')).toHaveCount(0);
  239 |       // A real follow-up execution proves the cancelled engine can be used again.
  240 |       await enter(page, kind === 'sql' ? 'SELECT 42 AS weiter' : 'cat("WEITER_NACH_ABBRUCH")');
  241 |       await page.getByRole('button', {name: 'Ausführen', exact: true}).click();
  242 |       if (kind === 'sql') await expect(page.locator('.result-grid tbody td')).toHaveText('42');
  243 |       else await expect(page.getByRole('log')).toContainText('WEITER_NACH_ABBRUCH');
  244 |     },
  245 |   );
  246 | }
  247 |
  248 | test('Project settings: writer lease and stored files survive cleanup while reader edits personal settings', async ({
  249 |   page,
  250 |   context,
  251 | }) => {
  252 |   const url = await create(page);
  253 |   const before = await sessionOf(page);
  254 |   await settingsOf(page).click();
  255 |   const reader = await context.newPage();
  256 |   await reader.goto(url + '/settings');
  257 |   await expect(reader.getByText(/Das Projekt ist hier nur lesbar/)).toBeVisible();
  258 |   expect((await sessionOf(reader)).readOnly).toBe(true);
  259 |   await reader.getByLabel('Editor-Schriftgrösse').selectOption('19');
  260 |   await expect(reader.locator('.settings-save-status')).toHaveText('Einstellungen gespeichert');
  261 |   await page.evaluate(async () => {
  262 |     const root = await navigator.storage.getDirectory();
  263 |     const projects = await root.getDirectoryHandle('workspaces', {create: true});
  264 |     const current = await projects.getDirectoryHandle(location.pathname.split('/')[2]!, {
  265 |       create: true,
  266 |     });
  267 |     const writer = await (
  268 |       await current.getFileHandle('settings-protected.bin', {create: true})
```
