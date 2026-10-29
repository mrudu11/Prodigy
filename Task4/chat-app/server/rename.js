const fs = require('fs');
for (const f of ['routes.js', 'index.js', 'schema.sql']) {
  let s = fs.readFileSync(f, 'utf8');
  s = s.replace(/room_members/g, 'chat_members');
  s = s.replace(/\b(FROM|INTO|JOIN|REFERENCES|EXISTS) rooms\b/g, '$1 chattype');
  fs.writeFileSync(f, s);
  console.log('updated', f);
}