# Optional local Windows voice

SAPI runs only after an explicit local execution request with a selected installed voice. It is never called by doctor or ordinary rendering. There is no cloud fallback or model download.

```sh
npm run studio -- voices
npm run studio -- voice /absolute/project.json "Microsoft David Desktop" /absolute/new-voice --execute-local
npm run studio -- voice-demo /absolute/new-fixed-comparison "Microsoft David Desktop" --execute-local
```

`voice` preserves the original project, cues and approval. It creates short WAV clips, measured durations, a combined narration file and `proposal.json`. Proposed sentence cues are suggestions, with no word alignment or pronunciation review. Import the new audio into stable `inputs/`, author a new timeline and obtain approval for the complete new snapshot before production rendering. Unsupported operating systems or unavailable selected voices fail; they never choose another provider or voice.

`voice-demo` is a closed synthetic exception: it loads the source-pinned fictional 36-second sample, generates its fixed narration and renders both comparison variants with exactly the same audio. It accepts no manuscript or audio path. Narration exceeding 36 seconds is rejected instead of silently accelerated or cut. Shorter narration is padded; the fixed visual cue schedule remains a comparison fixture, not a claim of speech alignment. Both videos are marked synthetic and not human-audited.

Voice naturalness, names, numbers, pauses and cue fit still need human listening. Technical audio probing and complete decoding cannot establish those qualities. CI uses the tone fixture and never invokes SAPI.
