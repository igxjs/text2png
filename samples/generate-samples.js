const fs = require('node:fs');
const text2png = require('../index.js');

// Test 1: Avatar - 200x200 with initials
console.log('Creating avatar (200x200)...');
const avatar = text2png('IGX', {
  width: 200,
  height: 200,
  font: '80px Arial',
  textColor: 'white',
  backgroundColor: '#4F46E5',
  textAlign: 'center',
  verticalAlign: 'middle'
});
fs.writeFileSync('test-avatar.png', avatar);

// Test 2: Long text that needs scaling
console.log('Creating text that needs scaling...');
const scaledText = text2png('This is a very long text that will be scaled down', {
  width: 300,
  height: 100,
  font: '40px Arial',
  textColor: 'black',
  backgroundColor: '#f0f0f0',
  textAlign: 'center',
  verticalAlign: 'middle',
  padding: 10
});
fs.writeFileSync('test-scaled.png', scaledText);

// Test 3: Fixed width, auto height (backward compatible)
console.log('Creating fixed width with auto height...');
const fixedWidth = text2png('Hello World', {
  width: 400,
  font: '30px Arial',
  textColor: 'blue',
  backgroundColor: 'white',
  textAlign: 'center',
  padding: 20,
  borderWidth: 2,
  borderColor: 'blue'
});
fs.writeFileSync('test-fixed-width.png', fixedWidth);

// Test 4: No fixed dimensions (original behavior - backward compatible)
console.log('Creating with auto size (original behavior)...');
const autoSize = text2png('Hello World!', {
  font: '30px Arial',
  textColor: 'green',
  backgroundColor: 'lightyellow',
  padding: 15
});
fs.writeFileSync('test-auto-size.png', autoSize);

// Test 5: Multi-line text with fixed dimensions
console.log('Creating multi-line text in fixed box...');
const multiLine = text2png('Line 1\nLine 2\nLine 3', {
  width: 250,
  height: 150,
  font: '24px Arial',
  textColor: '#333',
  backgroundColor: '#fff',
  textAlign: 'center',
  verticalAlign: 'middle',
  padding: 10,
  borderWidth: 1,
  borderColor: '#ccc',
  lineSpacing: 8  // Add spacing between lines to prevent overlap
});
fs.writeFileSync('test-multiline.png', multiLine);

console.log('\n✅ All test images created successfully!');
console.log('Check the following files:');
console.log('  - test-avatar.png (200x200 avatar)');
console.log('  - test-scaled.png (auto-scaled text)');
console.log('  - test-fixed-width.png (fixed width, auto height)');
console.log('  - test-auto-size.png (original auto-size behavior)');
console.log('  - test-multiline.png (multi-line in fixed box)');