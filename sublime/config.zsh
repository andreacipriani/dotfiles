export SUBLIMEPATH="/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl"
export SUBLPKGPATH="~/Library/Application\ Support/Sublime\ Text\ 3/Packages"

if [ ! -f ~/.dotfiles/bin/subl ]; then
	echo "Creating sym link to subl"
    ln -s $SUBLIMEPATH ~/.dotfiles/bin/subl
fi
