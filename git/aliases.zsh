# Use `hub` as our git wrapper:
#   http://defunkt.github.com/hub/
hub_path=$(which hub)
if (( $+commands[hub] ))
then
  alias git=$hub_path
fi

# Git aliases
alias gpm="git push origin master"
alias gpr='git pull --rebase'
alias gst="git status -sb"
alias glog="git log --oneline --decorate"
alias gp='git push origin HEAD'
alias gpo="git push --set-upstream origin $(git branch | awk '/^\* / { print $2 }')"
alias grbc="gitc rebase --continue"
alias grm="git fetch && git rebase origin/master"
alias grmi="git fetch && git rebase origin/master -i"
alias ga="git add -p"
alias gall="git add ."
alias gc='git commit'
alias gca='git commit -a'
alias gco='git checkout'
alias gcom='git checkout master'
alias gcb='git checkout -b'
alias gb='git branch'
alias gac='git add -A && git commit -m'
alias grbtaketheirs="git checkout --ours . && git add ."
alias grbtakemine="git checkout --theirs . && git add ."
alias gclean= "git gc --aggressive && git prune"
alias gcpc="gitc cherry-pick --continue"
alias gcm="git commit -m"
# Remove `+` and `-` from start of diff lines; just rely upon color.
alias gd='git diff --color | sed "s/^\([^-+ ]*\)[-+ ]/\\1/" | less -r'
alias gfix="git diff --name-only | uniq | xargs git mergetool"
alias scformatpush="sc-format && git add . && git commit --amend --no-edit && git push"
alias gshipit="sc-format && git add . && git commit --amend --no-edit && gp -f"