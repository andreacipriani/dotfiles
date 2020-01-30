const P = require('./lib/parsimmon')

const PBX = P.createLanguage({
	// References: () => P.regexp(/([A-Z|0-9]{32})|([A-Z|0-9]{24})|([A-Z|0-9]{10})/)
	// 	.assert(r => {
	// 		let hasNumber = false
	// 		let hasLetter = false
	// 		for (let i = 0; i < r.length; i++) {
	// 			isNaN(Number(r[i])) ? hasLetter = true : hasNumber = true	
	// 		}
	// 		return hasNumber && hasLetter && (r.length === 32 || r.length === 24 || r.length === 10)
	// 	}),
	Properties: () => P.regexp(/([a-zA-Z0-9_][a-zA-Z0-9_]*)((.[a-zA-Z0-9_][a-zA-Z0-9_]*)+)?/),
	Path: r => P.alt(
		P.seqObj(P.string('/'), ['properties', P.alt(P.string('..'), r.Properties)], ['rest', P.alt(r.Path, P.optWhitespace)]),
		P.seqObj(['properties', P.alt(P.string('..'), r.Properties)], ['rest', r.Path])
	),
	NumberLiteral: () => P.regexp(/-?([0-9]+)((.[0-9]+)+)?/),
	StringLiteral: () => P.regexp(/"(?:[^\\"]|\\(?:[bfnrtv"\\/]|u[0-9a-fA-F]{4}))*"/),
	List: r => P
		.alt(r.StringLiteral,/* r.References, */r.Properties, r.NumberLiteral, r.Path, r.List, r.Object, P.optWhitespace)
		.trim(P.optWhitespace)
		.sepBy(P.string(','))
		.wrap(P.string('('), P.string(')')),
	Object: r => P
		.alt(r.Configuration, P.optWhitespace)
		.trim(P.optWhitespace)
		.sepBy(P.string(';'))
		.wrap(P.string('{'), P.string('}')),
	Configuration: r => P.seqObj(
		['lhs', P.alt(/*r.References,*/ r.Properties, r.StringLiteral)], P.optWhitespace,
		P.string('='), P.optWhitespace,
		['rhs', P.alt(r.StringLiteral,/* r.References,*/ r.Properties, r.NumberLiteral, r.Path, r.List, r.Object)]
	),
	Project: r => P
		.seqObj(
			['project', r.Object],
			P.optWhitespace
		)
})


require("fs").readFile('project.pbxproj', (err, fileData) => {
	if (err) throw err

	const data = String(fileData)
	let pbx = '', commentSymbol = ''
	let toInsert = true, insideString = false
	for (let i = 0; i < data.length; i++) {
		const element = data[i];
		if (element === '/' && data[i+1] === '/' && !insideString) {
			toInsert = false
			commentSymbol = '//'
		} else if (element === '/' && data[i+1] === '*' && !insideString) {
			toInsert = false
			commentSymbol = '/*'
		} else if (data[i-2] === '*' && data[i-1] === '/' && commentSymbol === '/*' && !insideString) {
			toInsert = true
			commentSymbol = ''
		} else if (data[i-1] === '\n' && commentSymbol === '//' && !insideString) {
			toInsert = true
			commentSymbol = ''
		} else if (element === '"' && data[i-1] !== '\\') {
			insideString = !insideString
		}
		
		if (toInsert) pbx += element
	}

	try {
		const ast = PBX.Project.tryParse(pbx)
		console.log(ast)
	} catch (error) {
		console.log(error)
	}
	
})


// const brackets = ['{', '{','(', '}', '{', '}', '}']

// function getDiagnostic(brackets) {
// 	let stack = []
				
// 	for (let i = 0; i < brackets.length; i++) {
// 		console.log(stack)
// 		if (brackets[i] === '(' || brackets[i] === '[' || brackets[i] === '{')
// 			stack.push(brackets[i])

// 		if (stack.length === 0)
// 			return console.log('not balanced', i)

// 		if (brackets[i] === ')') {
// 			const x = stack.pop()
// 			if (x === '{' || x === '[')
// 				return console.log('unclosed parenthesis', i)
// 		} else if (brackets[i] === '}') {
// 			const x = stack.pop()
// 			if (x === '(' || x === '[')
// 				return console.log('unclosed braces', i)
// 		} else if (brackets[i] === ']') {
// 			const x = stack.pop()
// 			if (x === '(' || x === '{')
// 				return console.log('unclose brackets', i)
// 		}
// 	}

// 	if (stack.length === 0)
// 		console.log('deu bom')
// 	else
// 		console.log('deu bad')
// }

// getDiagnostic(brackets)

