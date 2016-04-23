#
# ~/.bash_profile
#

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi

[[ -f ~/.bashrc ]] && . ~/.bashrc

xrandr --output GPU-1.DVI-I-1 --auto --right-of GPU-0.DVI-I-1
xrandr --output GPU-1.DP-1 --auto --left-of GPU-0.DVI-I-1

