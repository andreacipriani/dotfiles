alias xcode="open -a Xcode"
alias watchos="open /Applications/Xcode.app/Contents/Developer/Applications/Simulator\ \(Watch\).app"
alias xcodetemplates='cd ~/Library/Developer/Xcode/Templates/'
alias cleanderivedata='rm -rf ~/Library/Developer/Xcode/DerivedData'
alias pi='pod install --repo-update'

# Open in Xcode, credits to @orta
openx(){ 
  if test -n "$(find . -maxdepth 1 -name '*.xcworkspace' -print -quit)"
  then
    echo "Opening workspace"
    open *.xcworkspace
    return
  else
    if test -n "$(find . -maxdepth 1 -name '*.xcodeproj' -print -quit)"
    then
      echo "Opening project"
      open *.xcodeproj
      return  
    else
      echo "Nothing found"
    fi
  fi
}
