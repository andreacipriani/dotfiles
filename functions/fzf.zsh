# fzf custom functions, inspired by https://github.com/junegunn/fzf#fuzzy-completion-for-bash-and-zsh https://github.com/junegunn/fzf/wiki/examples

# ss -  open files with subl after fuzzy search

shelp() {
    echo "□ shome - search from home\n□ ss - subl\n□ scd - change dir \n□ scdh - change dir from home\n□ shr - history\n□ sbr - branches"
}

#Search from home
shome() {
  currentDir=$(pwd)
  cd
  fzf-tmux
  cd $currentDir
}

# ss - fuzzy search and open with sublime
ss() {
  local files
  IFS=$'\n' files=($(fzf-tmux --query="$1" --multi --select-1 --exit-0))
  [[ -n "$files" ]] && ${EDITOR:-subl} "${files[@]}"
}

# scd - fuzzy cd into directories

scd() {
  echo "executing scd"
  local dir
  dir=$(find ${1:-.} -path '*/\.*' -prune -o -type d -print 2> /dev/null | fzf-tmux +m)
  echo $dir
  cd "$dir"
}

scdh() {
  cd
  local dir
  dir=$(find ${1:-.} -path '*/\.*' -prune -o -type d -print 2> /dev/null | fzf-tmux +m)
  cd "$dir"
}

# shr - search in history
shr() {
  eval $( ([ -n "$ZSH_NAME" ] && fc -l 1 || history) | fzf-tmux +s --tac | sed 's/ *[0-9]* *//')
}

# sbr - checkout git branch (including remote branches), sorted by most recent commit, limit 30 last branches
sbr() {
  local branches branch
  branches=$(git for-each-ref --count=30 --sort=-committerdate refs/heads/ --format="%(refname:short)") &&
  branch=$(echo "$branches" |
           fzf-tmux -d $(( 2 + $(wc -l <<< "$branches") )) +m) &&
  git checkout $(echo "$branch" | sed "s/.* //" | sed "s#remotes/[^/]*/##")
}