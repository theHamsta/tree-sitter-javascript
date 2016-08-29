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
    [$._expression, $.method_definition],
    [$._expression, $.formal_parameters]
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

    paranthesize_type: $ => seq(
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
      optional($.type_arguments)
    ),

    type_name: $ => choice(
      $.identifier_reference,
      $.namespace_name, '.', $.identifier_reference
    ),

    namespace_name: $ => choice(
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

    tuple_element_type: $ => $.type

    union_type: $ => seq(
      $.union_or_intersection_type, '|', $.intersection_or_primary_type
    ),

    intersection_type: $ => seq(
      $.intersection_or_primary_type, '&', $.primary_type
    ),

    function_type: seq(
      optional($.type_parameters),
      '(',
      optional($.parameters_list),
      ')',
      '=>',
      $.type
    ),

    type_query: $ => seq('typeof', $.type_query_expression)

    type_query_expression: $ => choice(
      $.identifier_reference,
      seq($.type_query_expression, '.', $.identifier_name)
    ),

    this_type: $ => 'this',

    property_signature: $ => seq(
      $.property_name, optional('?'), optional($.type_annotation)
    ),

    property_name: $ => choice(
      $.identifier_name,
      $.string_literal,
      $.numeric_literal
    ),

    type_annotation: $ => seq(
      ':', $.type
    ),

    call_signature: $ => seq(
      optional($.type_parameters),
      '(', optional($.parameters_list), ')', optional($.type_annotation)
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
      seq('...', $.binding_identifier, optional($.type_annotation))

    construct_signature: $ => seq(
      'new',
      optional($.type_parameters),
      '(', optional($.parameter_list), ')',
      optional($.type_annotation)
    ),

    index_signature: $ => choice(
      seq('[', $.binding_identifier, ':', 'string', ']', $.type_annotation),
      seq('[', $.binding_identifier, ':', 'number', ']', $.type_annotation),
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

    unary_expression: $ => choice(
      ...
      '<', $.type, '>', $.unary_expression
    ),

    declaration: $ => choice(
      ...,
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
      seq('function', optional($.binding_identifier), call_signature, '{', $.function_body, '}')
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
      'class', optional($.binding_identifier), optional($.type_parameters), $.class_heritage, '{', $.class_body, '}'
    ),

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
      commaSep1($.enum_member), optional(',')
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
      $.interface-declaration,
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
        $.import_alias_declaration
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
        implementation_module_element
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

      declaration_module: optional($.declaration_module_elements),

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
          seq('*', $.from_clause, ';'),
          seq($.export_clause, $.from_clause, ';'),
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
          $.ambient_class-declaration,
          $.interface_declaration,
          $.ambient_enum_declaration,
          $.ambient_namespace_declaration,
          $.import_alias_declaration
        )
      ),

      ambient_module_declaration: $ => seq(
        'declare', 'module', $.string_literal, '{', declaration_module, '}'
      )









    program: $ => optional($._statements),

    _statements: $ => choice(
      seq($._statement, optional($._statements)),
      choice(
        $.trailing_break_statement,
        $.trailing_yield_statement,
        $.trailing_throw_statement,
        $.trailing_return_statement,
        $.trailing_expression_statement
      )
    ),

    //
    // Statements
    //

    _statement: $ => choice(
      $.expression_statement,
      $.var_declaration,
      $.statement_block,

      $.if_statement,
      $.switch_statement,
      $.for_statement,
      $.for_in_statement,
      $.for_of_statement,
      $.while_statement,
      $.do_statement,
      $.try_statement,

      $.break_statement,
      $.return_statement,
      $.yield_statement,
      $.throw_statement,
      $.empty_statement
    ),

    expression_statement: $ => seq(
      err(choice($._expression, $.comma_op)), terminator()
    ),

    trailing_expression_statement: $ => seq(
      choice($._expression, $.comma_op)
    ),

    var_declaration: $ => seq(
      variableType(),
      commaSep1(err(choice(
        $.identifier,
        $.var_assignment
      ))),
      terminator()
    ),

    statement_block: $ => seq(
      '{', err(optional($._statements)), '}'
    ),

    if_statement: $ => prec.right(seq(
      'if',
      $._paren_expression,
      $._statement,
      optional(seq(
        'else',
        $._statement
      ))
    )),

    switch_statement: $ => seq(
      'switch',
      '(', $._expression, ')',
      '{', repeat(choice($.case, $.default)), '}'
    ),

    for_statement: $ => seq(
      'for',
      '(',
      choice(
        $.var_declaration,
        seq(err(commaSep1($._expression)), ';'),
        ';'
      ),
      optional(err($._expression)), ';',
      optional(err($._expression)),
      ')',
      $._statement
    ),

    for_in_statement: $ => seq(
      'for',
      '(',
      optional(variableType()),
      $._expression,
      'in',
      $._expression,
      ')',
      $._statement
    ),

    for_of_statement: $ => seq(
      'for',
      '(',
      optional(variableType()),
      $._expression,
      'of',
      $._expression,
      ')',
      $._statement
    ),

    while_statement: $ => seq(
      'while',
      $._paren_expression,
      $._statement
    ),

    do_statement: $ => seq(
      'do',
      $.statement_block,
      'while',
      $._paren_expression,
      terminator()
    ),

    try_statement: $ => seq(
      'try',
      $.statement_block,
      optional($.catch),
      optional($.finally)
    ),

    break_statement: $ => seq(
      'break',
      terminator()
    ),

    trailing_break_statement: $ => 'break',

    return_statement: $ => seq(
      'return',
      optional($._expression),
      terminator()
    ),

    trailing_return_statement: $ => seq(
      'return',
      optional($._expression)
    ),

    yield_statement: $ => seq(
      'yield',
      optional($._expression),
      terminator()
    ),

    trailing_yield_statement: $ => seq(
      'yield',
      optional($._expression)
    ),

    throw_statement: $ => seq(
      'throw',
      $._expression,
      terminator()
    ),

    trailing_throw_statement: $ => seq(
      'throw',
      $._expression
    ),

    empty_statement: $ => ';',

    //
    // Statement components
    //

    case: $ => seq(
      'case',
      $._expression,
      ':',
      optional($._statements)
    ),

    default: $ => seq(
      'default',
      ':',
      optional($._statements)
    ),

    catch: $ => seq(
      'catch',
      optional(seq('(', $.identifier, ')')),
      $.statement_block
    ),

    finally: $ => seq(
      'finally',
      $.statement_block
    ),

    var_assignment: $ => seq(
      $.identifier,
      '=',
      $._expression
    ),

    _paren_expression: $ => seq(
      '(', err(choice($._expression, $.comma_op)), ')'
    ),

    //
    // Expressions
    //

    _expression: $ => choice(
      $.object,
      $.array,
      $.class,
      $.function,
      $.arrow_function,
      $.generator_function,
      $.function_call,
      $.new_expression,
      $.member_access,
      $.subscript_access,
      $.assignment,
      $.math_assignment,
      $.ternary,
      $.bool_op,
      $.math_op,
      $.bitwise_op,
      $.rel_op,
      $.type_op,
      $.delete_op,
      $.void_op,
      $._paren_expression,

      $.this_expression,
      $.identifier,
      $.number,
      $.string,
      $.template_string,
      $.regex,
      $.true,
      $.false,
      $.null,
      $.undefined
    ),

    object: $ => prec(PREC.OBJECT, seq(
      '{', commaSep(err(choice($.pair, $.method_definition))), '}'
    )),

    array: $ => seq(
      '[', commaSep(err($._expression)), ']'
    ),

    class: $ => seq(
      'class',
      $.identifier,
      optional(seq('extends', $._expression)),
      $.class_body
    ),

    function: $ => seq(
      'function',
      optional($.identifier),
      '(', optional($.formal_parameters), ')',
      $.statement_block
    ),

    arrow_function: $ => seq(
      choice(
        $.identifier,
        seq('(', optional($.formal_parameters), ')')
      ),
      '=>',
      choice(
        $._expression,
        $.statement_block
      )
    ),

    generator_function: $ => seq(
      'function',
      '*',
      optional($.identifier),
      '(', optional($.formal_parameters), ')',
      $.statement_block
    ),

    function_call: $ => prec(PREC.CALL, seq(
      choice($._expression, $.super),
      '(', err(optional($.arguments)), ')'
    )),

    new_expression: $ => prec(PREC.NEW, seq(
      'new',
      $._expression
    )),

    member_access: $ => prec(PREC.MEMBER, seq(
      $._expression,
      '.',
      $.identifier
    )),

    subscript_access: $ => prec.right(PREC.MEMBER, seq(
      $._expression,
      '[', err($._expression), ']'
    )),

    assignment: $ => prec.right(PREC.ASSIGN, seq(
      choice(
        $.identifier,
        $.member_access,
        $.subscript_access
      ),
      '=',
      $._expression
    )),

    math_assignment: $ => prec.right(PREC.ASSIGN, seq(
      choice(
        $.identifier,
        $.member_access,
        $.subscript_access
      ),
      choice('+=', '-=', '*=', '/='),
      $._expression
    )),

    ternary: $ => prec.right(PREC.TERNARY, seq(
      $._expression, '?', $._expression, ':', $._expression
    )),

    bool_op: $ => choice(
      prec.left(PREC.NOT, seq('!', $._expression)),
      prec.left(PREC.AND, seq($._expression, '&&', $._expression)),
      prec.left(PREC.OR, seq($._expression, '||', $._expression))
    ),

    bitwise_op: $ => choice(
      prec.left(PREC.NOT, seq('~', $._expression)),
      prec.left(PREC.TIMES, seq($._expression, '>>', $._expression)),
      prec.left(PREC.TIMES, seq($._expression, '<<', $._expression)),
      prec.left(PREC.AND, seq($._expression, '&', $._expression)),
      prec.left(PREC.OR, seq($._expression, '^', $._expression)),
      prec.left(PREC.OR, seq($._expression, '|', $._expression))
    ),

    math_op: $ => choice(
      prec.left(PREC.NEG, seq('-', $._expression)),
      prec.left(PREC.NEG, seq('+', $._expression)),
      prec.left(PREC.INC, seq($._expression, '++')),
      prec.left(PREC.INC, seq($._expression, '--')),
      prec.left(PREC.INC, seq('++', $._expression)),
      prec.left(PREC.INC, seq('--', $._expression)),
      prec.left(PREC.PLUS, seq($._expression, '+', $._expression)),
      prec.left(PREC.PLUS, seq($._expression, '-', $._expression)),
      prec.left(PREC.TIMES, seq($._expression, '*', $._expression)),
      prec.left(PREC.TIMES, seq($._expression, '/', $._expression)),
      prec.left(PREC.TIMES, seq($._expression, '%', $._expression))
    ),

    delete_op: $ => prec(PREC.DELETE, seq(
      'delete',
      choice($.member_access, $.subscript_access))
    ),

    void_op: $ => prec(PREC.VOID, seq(
      'void', $._expression)
    ),

    comma_op: $ => prec(PREC.COMMA, seq(
      $._expression, ',', choice($.comma_op, $._expression))
    ),

    rel_op: $ => choice(
      prec.left(PREC.REL, seq($._expression, '<', $._expression)),
      prec.left(PREC.REL, seq($._expression, '<=', $._expression)),
      prec.left(PREC.REL, seq($._expression, '==', $._expression)),
      prec.left(PREC.REL, seq($._expression, '===', $._expression)),
      prec.left(PREC.REL, seq($._expression, '!=', $._expression)),
      prec.left(PREC.REL, seq($._expression, '!==', $._expression)),
      prec.left(PREC.REL, seq($._expression, '>=', $._expression)),
      prec.left(PREC.REL, seq($._expression, '>', $._expression))
    ),

    type_op: $ => choice(
      prec(PREC.TYPEOF, seq('typeof', $._expression)),
      prec.left(PREC.REL, seq($._expression, 'instanceof', $._expression)),
      prec.left(PREC.REL, seq($._expression, 'in', $._expression))
    ),

    //
    // Primitives
    //

    comment: $ => token(choice(
      seq('//', /.*/),
      seq('/*', repeat(choice(/[^\*]/, /\*[^\/]/)), '*/')
    )),

    string: $ => token(choice(
      seq('"', repeat(choice(/[^\\"\n]/, /\\./)), '"'),
      seq("'", repeat(choice(/[^\\'\n]/, /\\./)), "'")
    )),

    template_string: $ => token(seq(
      '`', repeat(/[^`]/), '`'
    )),

    regex: $ => token(seq(
      '/',
      repeat(choice(
        seq('[', /[^\]\n]*/, ']'), // square-bracket-delimited character class
        seq('\\', /./),            // escaped character
        /[^/\\\[\n]/               // any character besides '[', '\', '/', '\n'
      )),
      '/',
      repeat(/a-z/)
    )),

    number: $ => token(choice(
      seq(
        '0x',
        /[\da-fA-F]+/
      ),
      seq(
        /\d+/,
        optional(seq('.', /\d*/))
      )
    )),

    identifier: $ => (/[\a_$][\a\d_$]*/),

    this_expression: $ => 'this',
    super: $ => 'super',
    true: $ => 'true',
    false: $ => 'false',
    null: $ => 'null',
    undefined: $ => 'undefined',

    //
    // Expression components
    //

    arguments: $ => commaSep1(err($._expression)),

    class_body: $ => seq(
      '{',
      repeat(seq(
        optional('static'),
        $.method_definition,
        optional(';')
      )),
      '}'
    ),

    formal_parameters: $ => commaSep1($.identifier),

    method_definition: $ => seq(
      optional(choice('get', 'set', '*')),
      $.identifier,
      '(',
      optional($.formal_parameters),
      ')',
      $.statement_block
    ),

    pair: $ => seq(
      choice($.identifier, $.get_set_identifier, $.string, $.number),
      ':',
      $._expression
    ),

    get_set_identifier: $ => choice('get', 'set'),

    _line_break: $ => '\n'
  }
});

function commaSep1 (rule) {
  return seq(rule, repeat(seq(',', rule)));
}

function commaSep (rule) {
  return optional(commaSep1(rule));
}

function terminator () {
  return choice(';', sym('_line_break'));
}

function variableType () {
  return choice('var', 'let', 'const');
}
