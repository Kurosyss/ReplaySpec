import re, pathlib
path = pathlib.Path('tests/m3.3.spec.ts')
text = path.read_text(encoding='utf-8')
pattern = r'    const runRes = await request\.post\("/api/runs", \{ data: \{ variant: "fixed" \} \}\);\n    const \{ runId \} = await runRes\.json\(\);\n    let runData: any;\n    for \(let i = 0; i < 20; i\+\+\) \{\n      await new Promise\(\(r\) => setTimeout\(r, 1000\)\);\n      const poll = await request\.get\(`/api/runs/\$\{runId\}`, \{ timeout: 10000 \}\);\n      if \(poll\.ok\(\)\) \{\n        runData = await poll\.json\(\);\n        if \(runData\.verdict\) break;\n      \}\n    \}'
replacement = '    const runRes = await request.post("/api/runs", { data: { variant: "fixed" } });\n    expect(runRes.ok()).toBeTruthy();\n    const { runId } = await runRes.json();\n    await waitForRunM33(request, runId);'
new_text, n = re.subn(pattern, replacement, text)
print(f'Replaced {n} occurrences')
path.write_text(new_text, encoding='utf-8')
