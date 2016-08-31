const PREC = {
  COMMA: -1,
  ASSIGN: 0,
  OBJECT: 1,
  TERNARY: 1,
  OR: 2,
  AND: 3,
  PLUS: 4,
  REL: 5,
  TIMES: 6,
  TYPEOF: 7,
  DELETE: 7,
  VOID: 7,
  NOT: 8,
  NEG: 9,
  INC: 10,
  NEW: 11,
  CALL: 12,
  MEMBER: 13
};

module.exports = grammar({
  name: 'javascript',

  extras: $ => [
    $.comment,
    $._line_break,
    /[ \t\r]/
  ],

  conflicts: $ => [
    // [$._expression, $.method_definition],
    // [$._expression, $.formal_parameters],
    [$.type_name, $.namespace_name],
    [$.this_type, $.primary_expression],
    [$.yield_expression, $.binding_identifier, $.identifier_reference],
    [$.binding_identifier, $.identifier_reference],
    [$.yield_expression, $.identifier_reference],
    [$.yield_expression, $.binding_identifier],
    [$.cover_parenthesized_expression_and_arrow_parameter_list, $.rest_parameter],
    [$.type_query_expression, $.type_name, $.namespace_name],
    [$.primary_expression, $.type_query_expression],
    [$.type_name, $.namespace_name, $.type_query_expression, $.primary_expression],
    [$.type_name, $.namespace_name, $.primary_expression],
    [$.property_name, $.identifier_reference],
    [$.label_identifier, $.property_name],
    [$.literal, $.property_name],
    [$.equality_expression, $.relational_expression],
    [$.array_binding_pattern, $.array_literal],
    [$.shift_expression, $.additive_expression],
    [$.breakable_statement, $.iteration_statement],
    [$.function_expression, $.function_declaration],
    [$.hoistable_declaration, $.generator_expression]
  ],

  rules: {
    // Type Parameters
    type_parameters: $ => seq(
      '<', commaSep1($.type_parameter), '>'
    ),

    type_parameter: $ => seq(
      $.binding_identifier,
      optional($.constraint)
    ),

    constraint: $ => seq(
      'extends', $.type
    ),

    type_arguments: $ => seq(
      '<', commaSep1($.type), '>'
    ),

    type: $ => choice(
      $.union_or_intersection_type,
      $.function_type,
      $.constructor_type
    ),

    union_or_intersection_type: $ => choice(
      $.union_type,
      $.intersection_or_primary_type
    ),

    intersection_or_primary_type: $ => choice(
      $.intersection_type,
      $.primary_type
    ),

    primary_type: $ => choice(
      $.parenthesized_type,
      $.predefined_type,
      $.type_reference,
      $.object_type,
      $.array_type,
      $.tuple_type,
      $.type_query,
      $.this_type
    ),

    parenthesized_type: $ => seq(
      '(', $.type, ')'
    ),

    predefined_type: $ => choice(
      'any',
      'number',
      'boolean',
      'string',
      'symbol',
      'void'
    ),

    type_reference: $ => seq(
      $.type_name,
      // TODO, make type_arguments optional
      $.type_arguments
    ),

    type_name: $ => $._type_or_namespace_name,

    namespace_name: $ => $._type_or_namespace_name,

    _type_or_namespace_name: $ => choice(
      $.identifier_reference,
      $.namespace_name, '.', $.identifier_reference
    ),

    object_type: $ => seq(
      '{', optional($.type_body), '}'
    ),

    type_body: $ => choice(
      seq($.type_member_list, optional(';')),
      seq($.type_member_list, optional(','))
    ),

    type_member_list: $ => choice(
      $.type_member,
      seq($.type_member_list, ';', $.type_member),
      seq($.type_member_list, ',', $.type_member)
    ),

    type_member: $ => choice(
      $.property_signature,
      $.call_signature,
      $.construct_signature,
      $.index_signature,
      $.method_signature
    ),

    array_type: $ => seq(
      $.primary_type, '[', ']'
    ),

    tuple_type: $ => seq(
      '[', $.tuple_element_types, ']'
    ),

    tuple_element_types: $ => commaSep1(
      $.tuple_element_type
    ),

    tuple_element_type: $ => $.type,

    union_type: $ => seq(
      $.union_or_intersection_type, '|', $.intersection_or_primary_type
    ),

    intersection_type: $ => seq(
      $.intersection_or_primary_type, '&', $.primary_type
    ),

    function_type: $ => seq(
      optional($.type_parameters),
      '(',
      optional($.parameter_list),
      ')',
      '=>',
      $.type
    ),

		constructor_type: $ => seq(
			'new', optional($.type_parameters), '(', optional($.parameter_list), ')', '=>', $.type
		),

    type_query: $ => seq('typeof', $.type_query_expression),

    type_query_expression: $ => choice(
      $.identifier_reference,
			// FIXME: Should use identifier_name not identifier
      seq($.type_query_expression, '.', $.identifier)
    ),

    this_type: $ => 'this',

    property_signature: $ => seq(
      $.property_name, optional('?'), optional($.type_annotation)
    ),

    property_name: $ => choice(
			// FIXME: Should use identifier_name not identifier
      $.identifier,
      $.string_literal,
      $.numeric_literal
    ),

    type_annotation: $ => seq(
      ':', $.type
    ),

    call_signature: $ => seq(
      optional($.type_parameters),
      '(', optional($.parameter_list), ')', optional($.type_annotation)
    ),

    parameter_list: $ => choice(
      $.required_parameter_list,
      $.optional_parameter_list,
      $.rest_parameter,
      seq($.required_parameter_list, ',', $.optional_parameter_list),
      seq($.required_parameter_list, ',', $.rest_parameter),
      seq($.required_parameter_list, ',', $.optional_parameter_list, ',', $.rest_parameter)
    ),

    required_parameter_list: $ => commaSep1($.required_parameter),

    required_parameter: $ => choice(
      seq(
        optional($.accessibility_modifier),
        $.binding_identifier_or_pattern,
        optional($.type_annotation)),
      seq($.binding_identifier, ':', $.string_literal)
    ),

    accessibility_modifier: $ => choice(
      'public',
      'private',
      'protected'
    ),

    binding_identifier_or_pattern: $ => choice(
      $.binding_identifier,
      $.binding_pattern
    ),

    optional_parameter_list: $ => commaSep1($.optional_parameter),

    optional_parameter: $ => choice(
      seq(
        optional($.accessibility_modifier),
        $.binding_identifier_or_pattern,
        '?',
        optional($.type_annotation)),
      seq(
        optional($.accessibility_modifier),
        $.binding_identifier_or_pattern,
        '?',
        optional($.type_annotation)),
      seq(
        $.binding_identifier_or_pattern,
        '?',
        ':',
        $.string_literal)
    ),

    rest_parameter: $ =>
      seq('...', $.binding_identifier, optional($.type_annotation)),

    construct_signature: $ => seq(
      'new',
      optional($.type_parameters),
      '(', optional($.parameter_list), ')',
      optional($.type_annotation)
    ),

    index_signature: $ => choice(
      seq('[', $.binding_identifier, ':', 'string', ']', $.type_annotation),
      seq('[', $.binding_identifier, ':', 'number', ']', $.type_annotation)
    ),

    method_signature: $ => seq(
      $.property_name, optional('?'), $.call_signature
    ),

    type_alias_declaration: $ => seq(
      'type', $.binding_identifier, optional($.type_parameters), '=', $.type, ';'
    ),

    // Expressions

    property_definition: $ => choice(
      $.identifier_reference,
      $.cover_initialized_name,
      seq($.property_name, ':', $.assignment_expression),
      seq($.property_name, $.call_signature, '{', $.function_body, '}'),
      $.get_accessor,
      $.set_accessor
    ),

    get_accessor: $ => seq(
      'get', $.property_name, '(', ')', optional($.type_annotation), '{', $.function_body, '}'
    ),

    set_accessor: $ => seq(
      'set', $.property_name, '(', $.binding_identifier_or_pattern, optional($.type_annotation), ')', '{', $.function_body, '}'
    ),

    function_expression: $ => seq(
      'function', optional($.binding_identifier), $.call_signature, '{', $.function_body, '}'
    ),

    arrow_formal_parameters: $ => $.call_signature,

    arguments: $ => seq(
      optional($.type_arguments), '(', optional($.argument_list), ')'
    ),

    argument_list: $ => choice(
      $.assignment_expression,
      seq('...', $.assignment_expression),
      seq($.argument_list, ',', $.assignment_expression),
      seq($.argument_list, ',', '...', $.assignment_expression)
    ),

    unary_expression: $ => choice(
			$.postfix_expression,
      seq(choice(
        'delete',
        'void',
        'typeof',
        '++',
        '--',
        '+',
        '-',
        '~',
        '!',
        seq('<', $.type, '>')
      ),
      $.unary_expression)
    ),

    declaration: $ => choice(
			$.hoistable_declaration,
			$.class_declaration,
			$.lexical_declaration,
      $.interface_declaration,
      $.type_alias_declaration,
      $.enum_declaration
    ),

    variable_declaration: $ => choice(
      $.simple_variable_declaration,
      $.destructuring_variable_declaration
    ),

    simple_variable_declaration: $ => seq(
      $.binding_identifier, optional($.type_annotation), optional($.initializer)
    ),

    destructuring_variable_declaration: $ => seq(
      $.binding_identifier, optional($.type_annotation), $.initializer
    ),

    lexical_binding: $ => choice(
      $.simple_lexical_binding,
      $.destructuring_lexical_binding
    ),

    simple_lexical_binding: $ => seq(
      $.binding_identifier, optional($.type_annotation), optional($.initializer)
    ),

    destructuring_lexical_binding: $ => seq(
      $.binding_pattern, optional($.type_annotation), optional($.initializer)
    ),

    // Functions

    function_declaration: $ => choice(
      seq('function', optional($.binding_identifier), $.call_signature, '{', $.function_body, '}'),
      seq('function', optional($.binding_identifier), $.call_signature, ';')
    ),

    // Interfaces

    interface_declaration: $ => seq(
      'interface', $.binding_identifier, optional($.type_parameters), optional($.interface_extends_clause), $.object_type
    ),

    interface_extends_clause: $ => seq(
      'extends', $.class_or_interface_type_list
    ),

    class_or_interface_type_list: $ => commaSep1($.class_or_interface_type),

    class_or_interface_type: $ => $.type_reference,

    // Classes

    class_declaration: $ => seq(
      'class',
      optional($.binding_identifier),
      optional($.type_parameters),
      $.class_tail
    ),

    // TODO: hide class_declaration or have them both use a hidden class?
    // Possibly remove type parameters?
    class_expression: $ => $.class_declaration,


    class_heritage: $ => seq(
      optional($.class_extends_clause), optional($.implements_clause)
    ),

    class_extends_clause: $ => seq(
      'extends', $.class_type
    ),

    class_type: $ => $.type_reference,

    implements_clause: $ => seq(
      'implements', $.class_or_interface_type_list
    ),

    class_element: $ => choice(
      $.constructor_declaration,
      $.property_member_declaration,
      $.index_member_declaration
    ),

    constructor_declaration: $ => choice(
      seq(
        optional($.accessibility_modifier),
        'constructor',
        '(', optional($.parameter_list), ')',
        '{', $.function_body, '}'),
      seq(
        optional($.accessibility_modifier),
        'constructor',
        '(', optional($.parameter_list), ')',
        ';')
    ),

    property_member_declaration: $ => choice(
      $.member_variable_declaration,
      $.member_function_declaration,
      $.member_accessor_declaration
    ),

    member_variable_declaration: $ => seq(
      optional($.accessibility_modifier),
      optional('static'),
      $.property_name,
      optional($.type_annotation),
      optional($.initializer),
      ';'
    ),

    member_function_declaration: $ => choice(
      seq(
        optional($.accessibility_modifier),
        optional('static'),
        $.property_name,
        $.call_signature,
        '{', $.function_body, '}'
      ),
      seq(
        optional($.accessibility_modifier),
        optional('static'),
        $.property_name,
        $.call_signature,
        ';'
      )
    ),

    member_accessor_declaration: $ => choice(
      seq(
        optional($.accessibility_modifier),
        optional('static'),
        $.get_accessor
      ),
      seq(
        optional($.accessibility_modifier),
        optional('static'),
        $.set_accessor
      )
    ),

    index_member_declaration: $ => seq(
      $.index_signature, ';'
    ),

    // Enums

    enum_declaration: $ => seq(
      optional('const'), 'enum', $.binding_identifier, '{', optional($.enum_body), '}'
    ),

    enum_body: $ => seq(
      // TODO add back trailing comma
      commaSep1($.enum_member)
    ),

    enum_member: $ => choice(
      $.property_name,
      seq($.property_name, '=', $.enum_value)
    ),

    enum_value: $ => $.assignment_expression,

    // Namespaces

    namespace_declaration: $ => seq(
      'namespace', $.identifier_path, '{', $.namespace_body, '}'
    ),

    identifier_path: $ => choice(
      $.binding_identifier,
      seq($.identifier_path, '.', $.binding_identifier)
    ),

    namespace_body: $ => optional($.namespace_elements),

    namespace_elements: $ => repeat1($.namespace_element),

    namespace_element: $ => choice(
      $.statement,
      $.lexical_declaration,
      $.function_declaration,
      $.generator_declaration,
      $.class_declaration,
      $.interface_declaration,
      $.type_alias_declaration,
      $.enum_declaration,
      $.namespace_declaration,
      $.ambient_declaration,
      $.import_alias_declaration,
      $.export_namespace_element
    ),

    export_namespace_element: $ => seq(
      'export',
      choice(
        $.variable_statement,
        $.lexical_declaration,
        $.function_declaration,
        $.generator_declaration,
        $.class_declaration,
        $.interface_declaration,
        $.type_alias_declaration,
        $.enum_declaration,
        $.namespace_declaration,
        $.ambient_declaration,
        $.import_alias_declaration)
		),

    import_alias_declaration: $ => seq(
      'import', $.binding_identifier, '=', $.entity_name, ';'
    ),

    entity_name: $ => choice(
      $.namespace_name,
      seq($.namespace_name, '.', $.identifier_reference)
    ),

    // Scripts and Modules

    source_file: $ => choice(
      $.implementation_source_file,
      $.declaration_source_file
    ),

    implementation_source_file: $ => choice(
      $.implementation_script,
      $.implementation_module
    ),

    declaration_source_file: $ => choice(
      $.declaration_script,
      $.declaration_module
    ),

    implementation_script: $ => optional($.implementation_script_elements),

    implementation_script_elements: $ => repeat1(
      $.implementation_script_element
    ),

    implementation_script_element: $ => choice(
      $.implementation_element,
      $.ambient_module_declaration
    ),

    implementation_element: $ => choice(
      $.statement,
      $.lexical_declaration,
      $.function_declaration,
      $.generator_declaration,
      $.class_declaration,
      $.interface_declaration,
      $.type_alias_declaration,
      $.enum_declaration,
      $.namespace_declaration,
      $.ambient_declaration,
      $.import_alias_declaration
    ),

    declaration_script: $ => optional($.declaration_script_elements),

    declaration_script_elements: $ => repeat1(
      $.declaration_script_element
    ),

    declaration_script_element: $ => choice(
      $.declaration_element,
      $.ambient_module_declaration
    ),

    declaration_element: $ => choice(
      $.interface_declaration,
      $.type_alias_declaration,
      $.namespace_declaration,
      $.ambient_declaration,
      $.import_alias_declaration
    ),

    implementation_module: $ => optional($.implementation_module_elements),

    implementation_module_elements: $ => repeat1(
      $.implementation_module_element
    ),

    implementation_module_element: $ => choice(
      $.implementation_element,
      $.import_declaration,
      $.import_alias_declaration,
      $.import_require_declaration,
      $.export_implementation_element,
      $.export_default_implementation_element,
      $.export_list_declaration,
      $.export_assignment
    ),

    declaration_module: $ => optional($.declaration_module_elements),

    declaration_module_elements: $ => repeat1( $.declaration_module_element),

    declaration_module_element: $ => choice(
      $.declaration_element,
      $.import_declaration,
      $.import_alias_declaration,
      $.export_declaration_element,
      $.export_default_declaration_element,
      $.export_list_declaration,
      $.export_assignment
    ),

    import_declaration: $ => choice(
      seq('import', $.import_clause, $._from_clause, ';'),
      seq('import', $.string_literal, ';')
    ),

    import_clause: $ => choice(
      $.namespace_import,
      $.named_imports,
      seq($.identifier, ",", $.namespace_import),
      seq($.identifier, ",", $.named_imports),
      $.identifier
    ),

    export_clause: $ => seq(
      '{', commaSep($.export_specifier), '}'
    ),

    export_specifier: $ => choice(
      $.identifier,
      seq($.identifier, "as", $.identifier)
    ),

    _from_clause: $ => seq(
      "from", $.string_literal
    ),

    namespace_import: $ => seq(
      "*", "as", $.identifier
    ),

    named_imports: $ => seq(
      '{', commaSep($.import_specifier), '}'
    ),

    import_specifier: $ => choice(
      $.identifier,
      seq($.identifier, 'as', $.identifier)
    ),

    import_require_declaration: $ => seq(
      'import', $.binding_identifier, '=', 'require', '(', $.string_literal, ')', ';'
    ),

    export_implementation_element: $ => seq(
      'export',
      choice(
        $.variable_statement,
        $.lexical_declaration,
        $.function_declaration,
        $.generator_declaration,
        $.class_declaration,
        $.interface_declaration,
        $.type_alias_declaration,
        $.enum_declaration,
        $.namespace_declaration,
        $.ambient_declaration,
        $.import_alias_declaration
      )
    ),

    export_declaration_element: $ => seq(
      'export',
      choice(
        $.interface_declaration,
        $.type_alias_declaration,
        $.ambient_declaration,
        $.import_alias_declaration
      )
    ),

    export_default_implementation_element: $ => seq(
      'export',
      'default',
      choice(
        $.function_declaration,
        $.generator_declaration,
        $.class_declaration,
        seq($.assignment_expression, ';')
      )
    ),

    export_default_declaration_element: $ => seq(
      'export',
      'default',
      choice(
        $.ambient_function_declaration,
        $.ambient_class_declaration,
        seq($.identifier_reference, ';')
      )
    ),

    export_list_declaration: $ => seq(
      'export',
      choice(
        seq('*', $._from_clause, ';'),
        seq($.export_clause, $._from_clause, ';'),
        seq($.export_clause, ';')
      )
    ),

    export_assignment: $ => seq(
      'export', '=', $.identifier_reference, ';'
    ),

    // Ambients

    ambient_declaration: $ => seq(
      'declare',
      choice(
        $.ambient_variable_declaration,
        $.ambient_function_declaration,
        $.ambient_class_declaration,
        $.ambient_enum_declaration,
        $.ambient_namespace_declaration
      )
    ),

    ambient_variable_declaration: $ => seq(
      choice('var', 'let', 'const'),
      $.ambient_binding_list,
      ';'
    ),

    ambient_binding_list: $ => commaSep1($.ambient_binding),

    ambient_binding: $ => seq(
      $.binding_identifier, optional($.type_annotation)
    ),

    ambient_function_declaration: $ => seq(
      'function', $.binding_identifier, $.call_signature, ';'
    ),

    ambient_class_declaration: $ => seq(
      'class', $.binding_identifier, optional($.type_parameters), $.class_heritage, '{', $.ambient_class_body, '}'
    ),

    ambient_class_body: $ => optional($.ambient_class_body_elements),

    ambient_class_body_elements: $ => repeat1($.ambient_class_body_element),

    ambient_class_body_element: $ => choice(
      $.ambient_constructor_declaration,
      $.ambient_property_member_declaration,
      $.index_signature
    ),

    ambient_constructor_declaration: $ => seq(
      'constructor', '(', optional($.parameter_list), ')', ';'
    ),

    ambient_property_member_declaration: $ => seq(
      optional($.accessibility_modifier),
      optional('static'),
      $.property_name,
      choice(
        optional($.type_annotation),
        $.call_signature
      ),
      ';'
    ),

    ambient_enum_declaration: $ => $.enum_declaration,

    ambient_namespace_declaration: $ => seq(
      'namespace', $.identifier_path, '{', $.ambient_namespace_body, '}'
    ),

    ambient_namespace_body: $ => optional($.ambient_namespace_elements),

    ambient_namespace_elements: $ => repeat1($.namespace_element),

    ambient_namespace_element: $ => seq(
      optional('export'),
      choice(
        $.ambient_variable_declaration,
        $.ambient_lexical_declaration,
        $.ambient_function_declaration,
        $.ambient_class_declaration,
        $.interface_declaration,
        $.ambient_enum_declaration,
        $.ambient_namespace_declaration,
        $.import_alias_declaration
      )
    ),

    ambient_module_declaration: $ => seq(
      'declare', 'module', $.string_literal, '{', $.declaration_module, '}'
    ),

		// ES6

		identifier_reference: $ => choice(
			$.identifier,
			'yield'
		),

		binding_identifier: $ => choice(
			$.identifier,
			'yield'
		),

		label_identifier: $ => choice(
			$.identifier,
			'yield'
		),

		keyword: $ => choice(
			'break',
			'do',
			'in',
			'typeof',
			'case',
			'else',
			'instanceof',
			'var',
			'catch',
			'export',
			'new',
			'void',
			'class',
			'extends',
			'return',
			'while',
			'const',
			'finally',
			'super',
			'with',
			'continue',
			'for',
			'switch',
			'yield',
			'debugger',
			'function',
			'this',
			'default',
			'if',
			'throw',
			'delete',
			'import',
			'try'
		),

		future_reserved_word: $ => choice(
			'enum',
			'await',
			'implements',
			'interface',
			'package',
			'private',
			'protected',
			'public'
		),

		null_literal: $ => 'null',

		boolean_literal: $ => choice('true', 'false'),

		binding_pattern: $ => choice(
			$.object_binding_pattern,
			$.array_binding_pattern
		),

		array_binding_pattern: $ => choice(
			seq('[', optional($.elision), optional($.binding_rest_element), ']'),
			seq('[', commaSep1($.binding_elision_element),']'),
			seq('[', commaSep1($.binding_elision_element), ',', optional($.elision), optional($.binding_rest_element), ']')
		),

		object_binding_pattern: $ => prec(PREC.OBJECT, seq(
      // TODO: Add optional comma back
      '{', commaSep(err($.binding_property)), '}'
    )),

    elision: $ => repeat1(','),

		binding_elision_element: $ => seq(
			optional($.elision), $.binding_element
		),

		binding_property: $ => choice(
			$.single_name_binding,
			seq($.property_name, ':', $.binding_element)
		),

		binding_element: $ => choice(
			$.single_name_binding,
			seq($.binding_pattern, optional($.initializer))
		),

		single_name_binding: $ => seq(
			$.binding_identifier, optional($.initializer)
		),

		binding_rest_element: $ => seq(
			'...', $.binding_identifier
		),

		assignment_expression: $ => choice(
			$.conditional_expression,
			$.yield_expression,
			$.arrow_function,
			seq($.left_hand_side_expression, '=', $.assignment_expression),
			seq($.left_hand_side_expression, $.assignment_operator, $.assignment_expression)
		),

    assignment_operator: $ => choice(
      '*=',
      '/=',
      '%=',
      '+=',
      '-=',
      '<<=',
      '>>=',
      '>>>=',
      '&=',
      '^=',
      '|='
    ),

    expression: $ => $.assignment_expression,

    primary_expression: $ => choice(
      'this',
      $.identifier_reference,
      $.literal,
      $.array_literal,
      $.object_literal,
      $.function_expression,
      $.class_expression,
      $.generator_expression,
      $.regular_expression_literal,
      $.template_string,
      $.cover_parenthesized_expression_and_arrow_parameter_list
    ),

    cover_parenthesized_expression_and_arrow_parameter_list: $ => choice(
      seq('(', $.expression, ')'),
      seq('(',')'),
      seq('(', '...', $.binding_identifier, ')'),
      seq('(', $.expression, ',', '...', $.binding_identifier, ')')
    ),

    literal: $ => choice(
      $.null_literal,
      $.boolean_literal,
      $.numeric_literal,
      $.string_literal
    ),

    array_literal: $ => seq(
      '[',
      choice(
        optional($.elision),
        $.element_list,
        seq($.element_list, ',', optional($.elision))),
      ']'
    ),

    object_literal: $ => seq(
      // TODO: Add optional comma back
      '{', repeat1($.property_definition), '}'
    ),

    property_definition_list: $ => repeat1($.property_definition),

    property_defintion: $ => choice(
      $.identifier_reference,
      $.cover_initialized_name,
      seq($.property_name, ':', $.assignment_expression),
      $.method_definition
    ),



    class_tail: $ => seq(
      $.class_heritage, '{', $.class_body, '}'
    ),

    generator_expression: $ => seq(
      'function','*', optional($.binding_identifier), '(', $.formal_parameters, ')', '{', $.generator_body, '}'
    ),

    generator_body: $ => $.function_body,

    element_list: $ => choice(
      seq(optional($.elision), $.assignment_expression),
      seq(optional($.elision), $.spread_element),
      seq($.element_list, ',', optional($.elision), $.assignment_expression),
      seq($.element_list, ',', optional($.elision), $.spread_element)
    ),

    spread_element: $ => seq(
      '...', $.assignment_expression
    ),

    super_call: $ => seq(
      'super', $.arguments
    ),

    yield_expression: $ => seq(
      'yield', optional('*'), $.assignment_expression),

    conditional_expression: $ => choice(
      $.logical_or_expression,
      seq($.logical_or_expression, '?', $.assignment_expression, ':', $.assignment_expression)
    ),

    logical_or_expression: $ => choice(
      $.logical_and_expression,
      seq($.logical_or_expression, '||', $.logical_and_expression)
    ),

    logical_and_expression: $ => choice(
      $.bitwise_or_expression,
      seq($.logical_and_expression, '&&', $.bitwise_or_expression)
    ),

    bitwise_or_expression: $ => choice(
      $.bitwise_xor_expression,
      seq($.bitwise_or_expression, '|', $.bitwise_xor_expression)
    ),

    bitwise_xor_expression: $ => choice(
      $.bitwise_and_expression,
      seq($.bitwise_xor_expression, '^', $.bitwise_and_expression)
    ),

    bitwise_and_expression: $ => choice(
      $.equality_expression,
      seq($.bitwise_and_expression, '&', $.equality_expression)
    ),

    equality_expression: $ => choice(
      $.relational_expression,
      seq($.equality_expression,
        choice(
          '==',
          '!=',
          '===',
          '!=='
        ),
        $.relational_expression)
    ),

    relational_expression: $ => choice(
      $.shift_expression,
      seq(
        $.relational_expression,
        choice(
          '<',
          '>',
          '<=',
          '>=',
          'instanceof',
          'in'),
        $.shift_expression)
    ),

    shift_expression: $ => choice(
      $.additive_expression,
      seq(
        $.shift_expression,
        choice(
          '<<',
          '>>',
          '>>>'),
        $.additive_expression)
    ),

    additive_expression: $ => choice(
      $.multiplicative_expression,
      seq(
        $.additive_expression,
        choice('+','-'),
        $.multiplicative_expression
      )
    ),

    multiplicative_operator: $ => choice(
      '*', '/','%'
    ),

    multiplicative_expression: $ => choice(
      $.unary_expression,
      seq($.multiplicative_expression, $.multiplicative_operator, $.unary_expression)
    ),

    function_body: $ => $.function_statement_list,

    function_statement_list: $ => optional($.statement_list),

    statement_list: $ => repeat1($.statement_list_item),

    statement_list_item: $ => choice($.statement, $.declaration),

    cover_initialized_name: $ => seq(
      $.identifier_reference, $.initializer
    ),

    postfix_expression: $ => seq(
      $.left_hand_side_expression,
      choice('++', '--')
    ),

    left_hand_side_expression: $ => choice(
      $.new_expression,
      $.call_expression
    ),

    member_expression: $ => choice(
      $.primary_expression,
      seq($.member_expression,
        choice(
          seq('[', $.expression, ']'),
          seq('.', $.identifier),
          $.template_string)),
      $.super_property,
      $.meta_property,
      seq('new', $.member_expression, $.arguments)
    ),

    super_property: $ => choice(
      seq('super', '[', $.expression, ']'),
      seq('super', '.', $.identifier)
    ),

    meta_property: $ => $.new_target,

    new_target: $ => seq('new', '.', 'target'),

    new_expression: $ => choice(
      $.member_expression,
      seq('new', $.new_expression)
    ),

    call_expression: $ => choice(
      seq($.member_expression, $.arguments),
      $.super_call,
      seq(
        $.call_expression,
        choice(
          $.arguments,
          seq('[', $.expression, ']'),
          seq('.', $.identifier),
          $.template_string
        ))
    ),

    hoistable_declaration: $ => choice(
      $.function_declaration,
      $.generator_declaration
    ),

    lexical_declaration: $ => seq(
      $.let_or_const, $.binding_list
    ),

    binding_list: $ => commaSep1($.lexical_binding),


    ambient_lexical_declaration: $ => seq(
      $.let_or_const, $.ambient_binding_list
    ),

    let_or_const: $ => choice('let', 'const'),

    initializer: $ => seq(
      '=', $.assignment_expression
    ),

    statement: $ => choice(
      $.block_statement,
      $.variable_statement,
      $.empty_statement,

      $.expression_statement,
      $.if_statement,
      $.breakable_statement,
      $.continue_statement,
      $.return_statement,
      $.with_statement,
      $.labelled_statement,
      $.throw_statement,
      $.try_statement,
      $.debugger_statement
    ),

    labelled_statement: $ => seq(
      $.label_identifier, ':', $.labelled_item
    ),

    labelled_item: $ => choice(
      $.statement,
      $.function_declaration
    ),

    debugger_statement: $ => seq(
      'debugger', ';'
    ),

    block_statement: $ => $.block,

    block: $ => seq('{', optional($.statement_list), '}'),

    breakable_statement: $ => choice(
      $.iteration_statement,
      $.switch_statement
    ),

    iteration_statement: $ => choice(
      $.switch_statement,
      $.for_statement,
      $.for_in_statement,
      $.for_of_statement,
      $.while_statement,
      $.do_statement
    ),

    continue_statement: $ => choice(
      seq('continue', ';'),
      seq('continue', $.label_identifier, ';')
    ),

    with_statement: $ => seq(
      'with', '(', $.expression, ')', $.statement
    ),

    generator_declaration: $ => choice(
      seq('function', '*', $.binding_identifier, '(', $.formal_parameters, ')', '{', $.generator_body, '}'),
      seq('function', '*', '(', $.formal_parameters, ')', '{', $.generator_body, '}')
    ),

    variable_statement: $ => seq(
      'var', commaSep1($.variable_declaration)
    ),

    variable_declaration: $ => choice(
      seq($.binding_identifier, optional($.initializer)),
      seq($.binding_pattern, $.initializer)
    ),

    // program: $ => optional($._statements),
    //
    // _statements: $ => choice(
    //   seq($._statement, optional($._statements)),
    //   choice(
    //     $.trailing_break_statement,
    //     $.trailing_yield_statement,
    //     $.trailing_throw_statement,
    //     $.trailing_return_statement,
    //     $.trailing_expression_statement
    //   )
    // ),
    //
    // //
    // // Statements
    // //
    //
    // _statement: $ => choice(
    //   $.statement_block,
    //   $.expression_statement,
    //   $.var_declaration,
    //
    //   $.if_statement,
    //   $.switch_statement,
    //   $.for_statement,
    //   $.for_in_statement,
    //   $.for_of_statement,
    //   $.while_statement,
    //   $.do_statement,
    //   $.try_statement,
    //
    //   $.break_statement,
    //   $.return_statement,
    //   $.yield_statement,
    //   $.throw_statement,
    //   $.empty_statement
    // ),
    //
    expression_statement: $ => $.expression,
    //
    // trailing_expression_statement: $ => seq(
    //   choice($._expression, $.comma_op)
    // ),
    //
    // var_declaration: $ => seq(
    //   variableType(),
    //   commaSep1(err(choice(
    //     $.identifier,
    //     $.var_assignment
    //   ))),
    //   terminator()
    // ),
    //
    // statement_block: $ => seq(
    //   '{', err(optional($._statements)), '}'
    // ),
    //
    if_statement: $ => prec.right(seq(
      'if',
      $._paren_expression,
      $.statement,
      optional(seq(
        'else',
        $.statement
      ))
    )),
    //
    switch_statement: $ => seq(
      'switch',
      $._paren_expression,
      '{', repeat(choice($.case, $.default)), '}'
    ),

    for_statement: $ => seq(
      'for',
      '(',
      choice(
        $.variable_declaration,
        seq(err(commaSep1($.expression)), ';'),
        ';'
      ),
      optional(err($.expression)), ';',
      optional(err($.expression)),
      ')',
      $.statement
    ),

    for_in_statement: $ => seq(
      'for',
      '(',
      optional(variableType()),
      $.expression,
      'in',
      $.expression,
      ')',
      $.statement
    ),

    for_of_statement: $ => seq(
      'for',
      '(',
      optional(variableType()),
      $.expression,
      'of',
      $.expression,
      ')',
      $.statement
    ),

    while_statement: $ => seq(
      'while',
      $._paren_expression,
      $.statement
    ),

    do_statement: $ => seq(
      'do',
      $.block,
      'while',
      $._paren_expression,
      terminator()
    ),
    //
    try_statement: $ => seq(
      'try',
      $.block,
      optional($.catch),
      optional($.finally)
    ),
    //
    // break_statement: $ => seq(
    //   'break',
    //   terminator()
    // ),
    //
    // trailing_break_statement: $ => 'break',
    //
    return_statement: $ => seq(
      'return',
      optional($.expression),
      terminator()
    ),
    //
    // trailing_return_statement: $ => seq(
    //   'return',
    //   optional($._expression)
    // ),
    //
    // yield_statement: $ => seq(
    //   'yield',
    //   optional($._expression),
    //   terminator()
    // ),
    //
    // trailing_yield_statement: $ => seq(
    //   'yield',
    //   optional($._expression)
    // ),
    //
    throw_statement: $ => seq(
      'throw',
      $.expression,
      terminator()
    ),
    //
    // trailing_throw_statement: $ => seq(
    //   'throw',
    //   $._expression
    // ),
    //
    empty_statement: $ => ';',
    //
    // //
    // // Statement components
    // //
    //
    case: $ => seq(
      'case',
      $.expression,
      ':',
      $.statement_list
    ),

    default: $ => seq(
      'default',
      ':',
      $.statement_list
    ),

    catch: $ => seq(
      'catch',
      optional(seq('(', $.identifier, ')')),
      $.block
    ),

    finally: $ => seq(
      'finally',
      $.block
    ),
    //
    // var_assignment: $ => seq(
    //   $.identifier,
    //   '=',
    //   $._expression
    // ),
    //
    _paren_expression: $ => seq(
      '(', $.expression, ')'

    ),
    //
    // //
    // // Expressions
    // //
    //
    // // _expression: $ => choice(
    // //   $.object,
    // //   $.array,
    // //   $.class,
    // //   $.function,
    // //   $.arrow_function,
    // //   $.generator_function,
    // //   $.function_call,
    // //   $.new_expression,
    // //   $.member_access,
    // //   $.subscript_access,
    // //   $.assignment,
    // //   $.math_assignment,
    // //   $.ternary,
    // //   $.bool_op,
    // //   $.math_op,
    // //   $.bitwise_op,
    // //   $.rel_op,
    // //   $.type_op,
    // //   $.delete_op,
    // //   $.void_op,
    // //   $._paren_expression,
    // //
    // //   $.this_expression,
    // //   $.identifier,
    // //   $.numeric_literal,
    // //   $.string_literal,
    // //   $.template_string,
    // //   $.regular_expression_literal,
    // //   $.true,
    // //   $.false,
    // //   $.null,
    // //   $.undefined
    // // ),
    //
    // object: $ => prec(PREC.OBJECT, seq(
    //   '{', commaSep(err(choice($.pair, $.method_definition))), '}'
    // )),
    //
    // array: $ => seq(
    //   '[', commaSep(err($._expression)), ']'
    // ),
    //
    // class: $ => seq(
    //   'class',
    //   $.identifier,
    //   optional(seq('extends', $._expression)),
    //   $.class_body
    // ),
    //
    // function: $ => seq(
    //   'function',
    //   optional($.identifier),
    //   '(', optional($.formal_parameters), ')',
    //   $.statement_block
    // ),
    //
    arrow_function: $ => seq(
      $.arrow_parameters,
      '=>',
      $.concise_body
    ),

    arrow_parameters: $ => choice(
      $.binding_identifier,
      $.cover_parenthesized_expression_and_arrow_parameter_list
    ),

    concise_body: $ => choice(
      $.assignment_expression,
      seq('{', $.function_body, '}')
    ),
    //
    // generator_function: $ => seq(
    //   'function',
    //   '*',
    //   optional($.identifier),
    //   '(', optional($.formal_parameters), ')',
    //   $.statement_block
    // ),
    //
    // function_call: $ => prec(PREC.CALL, seq(
    //   choice($._expression, $.super),
    //   '(', err(optional($.arguments)), ')'
    // )),
    //
    // new_expression: $ => prec(PREC.NEW, seq(
    //   'new',
    //   $._expression
    // )),
    //
    // member_access: $ => prec(PREC.MEMBER, seq(
    //   $._expression,
    //   '.',
    //   $.identifier
    // )),
    //
    // subscript_access: $ => prec.right(PREC.MEMBER, seq(
    //   $._expression,
    //   '[', err($._expression), ']'
    // )),
    //
    // assignment: $ => prec.right(PREC.ASSIGN, seq(
    //   choice(
    //     $.identifier,
    //     $.member_access,
    //     $.subscript_access
    //   ),
    //   '=',
    //   $._expression
    // )),
    //
    // math_assignment: $ => prec.right(PREC.ASSIGN, seq(
    //   choice(
    //     $.identifier,
    //     $.member_access,
    //     $.subscript_access
    //   ),
    //   choice('+=', '-=', '*=', '/='),
    //   $._expression
    // )),
    //
    // ternary: $ => prec.right(PREC.TERNARY, seq(
    //   $._expression, '?', $._expression, ':', $._expression
    // )),
    //
    // bool_op: $ => choice(
    //   prec.left(PREC.NOT, seq('!', $._expression)),
    //   prec.left(PREC.AND, seq($._expression, '&&', $._expression)),
    //   prec.left(PREC.OR, seq($._expression, '||', $._expression))
    // ),
    //
    // bitwise_op: $ => choice(
    //   prec.left(PREC.NOT, seq('~', $._expression)),
    //   prec.left(PREC.TIMES, seq($._expression, '>>', $._expression)),
    //   prec.left(PREC.TIMES, seq($._expression, '<<', $._expression)),
    //   prec.left(PREC.AND, seq($._expression, '&', $._expression)),
    //   prec.left(PREC.OR, seq($._expression, '^', $._expression)),
    //   prec.left(PREC.OR, seq($._expression, '|', $._expression))
    // ),
    //
    // math_op: $ => choice(
    //   prec.left(PREC.NEG, seq('-', $._expression)),
    //   prec.left(PREC.NEG, seq('+', $._expression)),
    //   prec.left(PREC.INC, seq($._expression, '++')),
    //   prec.left(PREC.INC, seq($._expression, '--')),
    //   prec.left(PREC.INC, seq('++', $._expression)),
    //   prec.left(PREC.INC, seq('--', $._expression)),
    //   prec.left(PREC.PLUS, seq($._expression, '+', $._expression)),
    //   prec.left(PREC.PLUS, seq($._expression, '-', $._expression)),
    //   prec.left(PREC.TIMES, seq($._expression, '*', $._expression)),
    //   prec.left(PREC.TIMES, seq($._expression, '/', $._expression)),
    //   prec.left(PREC.TIMES, seq($._expression, '%', $._expression))
    // ),
    //
    // delete_op: $ => prec(PREC.DELETE, seq(
    //   'delete',
    //   choice($.member_access, $.subscript_access))
    // ),
    //
    // void_op: $ => prec(PREC.VOID, seq(
    //   'void', $._expression)
    // ),
    //
    // comma_op: $ => prec(PREC.COMMA, seq(
    //   $._expression, ',', choice($.comma_op, $._expression))
    // ),
    //
    // rel_op: $ => choice(
    //   prec.left(PREC.REL, seq($._expression, '<', $._expression)),
    //   prec.left(PREC.REL, seq($._expression, '<=', $._expression)),
    //   prec.left(PREC.REL, seq($._expression, '==', $._expression)),
    //   prec.left(PREC.REL, seq($._expression, '===', $._expression)),
    //   prec.left(PREC.REL, seq($._expression, '!=', $._expression)),
    //   prec.left(PREC.REL, seq($._expression, '!==', $._expression)),
    //   prec.left(PREC.REL, seq($._expression, '>=', $._expression)),
    //   prec.left(PREC.REL, seq($._expression, '>', $._expression))
    // ),
    //
    // type_op: $ => choice(
    //   prec(PREC.TYPEOF, seq('typeof', $._expression)),
    //   prec.left(PREC.REL, seq($._expression, 'instanceof', $._expression)),
    //   prec.left(PREC.REL, seq($._expression, 'in', $._expression))
    // ),
    //
    // //
    // // Primitives
    // //
    //
    comment: $ => token(choice(
      seq('//', /.*/),
      seq('/*', repeat(choice(/[^\*]/, /\*[^\/]/)), '*/')
    )),
    //
    string_literal: $ => token(choice(
      seq('"', repeat(choice(/[^\\"\n]/, /\\./)), '"'),
      seq("'", repeat(choice(/[^\\'\n]/, /\\./)), "'")
    )),
    //
    template_string: $ => token(seq(
      '`', repeat(/[^`]/), '`'
    )),
    //
    regular_expression_literal: $ => token(seq(
      '/',
      repeat(choice(
        seq('[', /[^\]\n]*/, ']'), // square-bracket-delimited character class
        seq('\\', /./),            // escaped character
        /[^/\\\[\n]/               // any character besides '[', '\', '/', '\n'
      )),
      '/',
      repeat(/a-z/)
    )),
    //
    numeric_literal: $ => token(choice(
      seq(
        '0x',
        /[\da-fA-F]+/
      ),
      seq(
        /\d+/,
        optional(seq('.', /\d*/))
      )
    )),
    //
    identifier: $ => (/[\a_$][\a\d_$]*/),
    //
    // this_expression: $ => 'this',
    // super: $ => 'super',
    // true: $ => 'true',
    // false: $ => 'false',
    // null: $ => 'null',
    // undefined: $ => 'undefined',
    //
    // //
    // // Expression components
    // //
    //
    // arguments: $ => commaSep1(err($._expression)),
    //
    class_body: $ => repeat1($.class_element),

    class_element: $ => choice(
      $.method_definition,
      seq('static', $.method_definition),
      ';'
    ),
    //
    formal_parameters: $ => choice(
      $.binding_rest_element,
      // TODO: add back optional(seq(',', $.binding_rest_element)
      seq(commaSep1($.binding_element))
    ),
    //
    method_definition: $ => choice(
      seq($.property_name, '(', $.formal_parameters, ')', '{', $.function_body, '}'),
      $.generator_method,
      seq('get', $.property_name, '(', ')', '{', $.function_body, '}'),
      seq('set', $.property_name, '(', $.property_set_parameter_list, ')', '{', $.function_body, '}')
    ),

    property_set_parameter_list: $ => $.binding_element,

    generator_method: $ => seq(
      '*', $.property_name, '(', $.formal_parameters, ')', '{', $.generator_body, '}'
    ),
    //
    // pair: $ => seq(
    //   choice($.identifier, $.get_set_identifier, $.string_literal, $.numeric_literal),
    //   ':',
    //   $._expression
    // ),
    //
    // get_set_identifier: $ => choice('get', 'set'),
    //
    _line_break: $ => '\n'
  }
});

function sepBy1 (sep, rule) {
  return seq(rule, repeat(seq(sep, rule)));
}

function sepBy (sep, rule) {
  return optional(sepBy1(sep, rule));
}

function commaSep1 (rule) {
  return sepBy1(',', rule);
}

function commaSep (rule) {
  return sepBy(',', rule);
}

function terminator () {
  return choice(';', sym('_line_break'));
}

function variableType () {
  return choice('var', 'let', 'const');
}
