if [ -f /etc/bash_completion ]; then
	    . /etc/bash_completion
fi

xhost +local:root > /dev/null 2>&1

complete -cf sudo

shopt -s cdspell
shopt -s checkwinsize
shopt -s cmdhist
shopt -s dotglob
shopt -s expand_aliases
shopt -s extglob
shopt -s histappend
shopt -s hostcomplete

export HISTSIZE=10000000
export HISTFILESIZE=${HISTSIZE}
export HISTCONTROL=ignoreboth
export JAVA_FONTS=/usr/share/fonts/TTF
export EDITOR=/usr/bin/nano
export BROWSER=/usr/bin/palemoon
export VISUAL="vim" 

# LS aliases
alias ls='ls --group-directories-first --time-style=+"%d.%m.%Y %H:%M" --color=auto -F'
alias ll='ls -l --group-directories-first --time-style=+"%d.%m.%Y %H:%M" --color=auto -F'
alias la='ls -la --group-directories-first --time-style=+"%d.%m.%Y %H:%M" --color=auto -F'
# Command line aliases
alias grep='grep --color=tty -d skip'
alias cp="cp -i"                          # confirm before overwriting something
alias df='df -h'                          # human-readable sizes
alias free='free -m'                      # show sizes in MB
alias np='nano PKGBUILD'
# Packman and Yaourt Commands
alias fixit='sudo rm -f /var/lib/pacman/db.lck'
alias update='yaourt -Syua --noconfirm'
alias updates='sudo pacman -Syu; sudo pacman -S --needed cifs-utils'
alias orphan='yaourt -Qtd'
alias inst='sudo pacman -S'
alias mirrors='sudo pacman-mirrors -g'
alias db='sudo pacman -Syy'
# i3 Commands
alias con='nano $HOME/.i3/config'
# Compton Configuration editing
alias comp='nano $HOME/.config/compton.conf'
# Printing Commands
alias printer='system-config-printer'
alias prettyprint='enscript --pretty-print --landscape --columns=2 --fancy-header'
# Fix the terminal when you have tried to view a bianary file
alias fix='echo -e "\033c" ; stty sane; setterm -reset; reset; tput reset; clear'
# Setup Colors for when using ls for directory structures.
eval `/usr/bin/dircolors -b ~/.dir_colors`

# ex - archive extractor
# usage: ex <file>
ex ()
{
  if [ -f $1 ] ; then
    case $1 in
      *.tar.bz2)   tar xjf $1   ;;
      *.tar.gz)    tar xzf $1   ;;
      *.bz2)       bunzip2 $1   ;;
      *.rar)       unrar x $1     ;;
      *.gz)        gunzip $1    ;;
      *.tar)       tar xf $1    ;;
      *.tbz2)      tar xjf $1   ;;
      *.tgz)       tar xzf $1   ;;
      *.zip)       unzip $1     ;;
      *.Z)         uncompress $1;;
      *.7z)        7z x $1      ;;
      *)           echo "'$1' cannot be extracted via ex()" ;;
    esac
  else
    echo "'$1' is not a valid file"
  fi
}

# prompt
PS1='[\u@\h \W]\$ '

export GOPATH=/home/lmyers/bin/gocode

export PATH="$PATH:$GOPATH/bin:$HOME/bin"


# For Powerline
powerline-daemon -q
POWERLINE_BASH_CONTINUATION=1
POWERLINE_BASH_SELECT=1
. /usr/lib/python3.6/site-packages/powerline/bindings/bash/powerline.sh
	
