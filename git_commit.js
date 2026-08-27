const { execFileSync } = require('child_process');
const git = 'C:\\Users\\bowam\\MinGit\\cmd\\git.exe';

function runGit(args) {
  console.log('Running:', git, args.join(' '));
  try {
    const out = execFileSync(git, args, { encoding: 'utf8', cwd: 'D:\\Projects\\Villagio farmer' });
    console.log(out);
  } catch (err) {
    console.error('Git error:', err.stdout || err.stderr || err.message);
  }
}

runGit(['config', 'user.name', 'Villagio Developer']);
runGit(['config', 'user.email', 'developer@villagio.co.ke']);
runGit(['branch', '-M', 'main']);
runGit(['add', '.']);
runGit(['commit', '-m', 'feat: initial release of Villagio Farm Fresh system']);
runGit(['status']);
runGit(['log', '-n', '1']);
