#!/bin/bash
# TEMP (WordPress/gutenberg#79889 measurement): sample memory every 2s until <pid> exits.
# Usage: build-memory-sampler.sh <pid> <output-dir>

root=$1
out=$2
mkdir -p "$out"
csv="$out/memory.csv"
echo "t,used_mb,swap_mb,tree_rss_mb,nproc" > "$csv"
start=$(date +%s)
peak=0

while kill -0 "$root" 2>/dev/null; do
	snap=$(ps -eo pid=,ppid=,rss=,args=)
	read -r used swap < <(awk '/^MemTotal:/{t=$2} /^MemAvailable:/{a=$2} /^SwapTotal:/{st=$2} /^SwapFree:/{sf=$2} END{printf "%d %d\n", (t-a)/1024, (st-sf)/1024}' /proc/meminfo)
	tree=$(awk -v r="$root" '{p[NR]=$1; pp[NR]=$2; line[NR]=$0; n=NR}
		END{inset[r]=1; c=1; while(c){c=0; for(i=1;i<=n;i++) if(!(p[i] in inset) && (pp[i] in inset)){inset[p[i]]=1; c=1}}
		for(i=1;i<=n;i++) if(p[i] in inset) print line[i]}' <<<"$snap")
	read -r rss nproc < <(awk '{s+=$3; k++} END{printf "%d %d\n", s/1024, k}' <<<"$tree")
	echo "$(( $(date +%s) - start )),$used,$swap,$rss,$nproc" >> "$csv"
	if [[ $rss -gt $peak ]]; then
		peak=$rss
		sort -k3 -rn <<<"$tree" | awk '{printf "%7d MB  ", $3/1024; $1=$2=$3=""; print substr($0, 4, 200)}' > "$out/peak-processes.txt"
	fi
	sleep 2
done

awk -F, 'NR>1{ if($2>u)u=$2; if($3>s)s=$3; if($4>r){r=$4; rt=$1}; if($5>p)p=$5; sum+=$4; n++ }
	END{ printf "| Peak system memory used | %d MB |\n| Peak swap used | %d MB |\n| Peak build-tree RSS | %d MB (at %ds) |\n| Mean build-tree RSS | %d MB |\n| Max build processes | %d |\n| Samples | %d |\n", u, s, r, rt, sum/n, p, n }' "$csv" > "$out/summary.md"
